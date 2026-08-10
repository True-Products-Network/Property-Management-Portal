import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/roles - List all roles with their permissions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is platform admin (from user_metadata or platform_user_roles table)
    let isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    
    // Also check platform_user_roles table if not already identified as platform admin
    if (!isPlatformAdmin) {
      const { data: platformRole } = await supabase
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .maybeSingle();
      
      if (platformRole?.role === "PLATFORM_ADMIN") {
        isPlatformAdmin = true;
      }
    }
    
    // Get user's tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    // If not platform admin and no tenant, deny access
    if (!isPlatformAdmin && !tenantUser) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Check if user is admin (role = 'admin' in tenant_users) or platform admin
    const isTenantAdmin = tenantUser?.role === 'admin';
    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Use tenant_id from tenantUser
    const tenantId = tenantUser?.tenant_id;

    // Fetch roles filtered by tenant - system roles OR tenant-specific roles
    let rolesQuery = supabase
      .from("roles")
      .select("*")
      .order("is_system_role", { ascending: false })
      .order("name");
    
    // Filter by tenant: show system roles OR roles for this specific tenant
    if (tenantId) {
      rolesQuery = rolesQuery.or(`is_system_role.eq.true,tenant_id.eq.${tenantId}`);
    } else if (!isPlatformAdmin) {
      // Non-platform admins without a tenant can only see system roles
      rolesQuery = rolesQuery.eq("is_system_role", true);
    }
    // Platform admins without tenant context see all roles

    const { data: roles, error: rolesError } = await rolesQuery;

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }

    // Format roles with permissions from JSONB
    interface Role {
      id: string;
      name: string;
      description: string | null;
      permissions: any;
      is_system_role: boolean;
      requires_mfa: boolean;
      is_active: boolean;
      user_count: number;
      created_at: string;
      updated_at: string;
      tenant_id?: string;
    }
    
    const rolesWithPermissions = (roles || []).map((role: Role) => {
      return {
        id: role.id,
        name: role.name,
        description: role.description || "",
        is_system_role: role.is_system_role,
        is_active: role.is_active,
        requires_mfa: role.requires_mfa || false,
        permissions: role.permissions || [],
        user_count: role.user_count || 0,
        created_at: role.created_at,
        updated_at: role.updated_at,
        tenantId: role.tenant_id,
      };
    });

    return NextResponse.json({ success: true, data: rolesWithPermissions });

  } catch (error) {
    console.error("Error in GET /api/admin/roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is platform admin
    let isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    
    if (!isPlatformAdmin) {
      const { data: platformRole } = await supabase
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .maybeSingle();
      
      if (platformRole?.role === "PLATFORM_ADMIN") {
        isPlatformAdmin = true;
      }
    }

    // Get user's tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .single();

    const isTenantAdmin = tenantUser?.role === 'admin';
    
    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = tenantUser?.tenant_id;
    
    // Cannot create roles without a tenant context (unless platform admin creating system roles)
    if (!tenantId && !isPlatformAdmin) {
      return NextResponse.json({ error: "No tenant context available" }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { name, description, permissions, is_active, requires_mfa, is_system_role } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Only platform admins can create system roles
    const createAsSystemRole = is_system_role === true && isPlatformAdmin;

    // Check if role name already exists for this tenant (or as system role)
    let existingQuery = supabase
      .from("roles")
      .select("id")
      .eq("name", name.trim())
      .limit(1);
    
    if (createAsSystemRole) {
      existingQuery = existingQuery.eq("is_system_role", true);
    } else if (tenantId) {
      existingQuery = existingQuery.eq("tenant_id", tenantId);
    }
    
    const { data: existingRole } = await existingQuery.single();

    if (existingRole) {
      return NextResponse.json({ error: "Role with this name already exists" }, { status: 400 });
    }

    // Insert role into roles table
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .insert({
        name: name.trim(),
        description: description?.trim() || "",
        permissions: permissions || [],
        is_system_role: createAsSystemRole,
        requires_mfa: requires_mfa || false,
        is_active: is_active !== false,
        tenant_id: createAsSystemRole ? null : tenantId,
        created_by: user.id,
      })
      .select()
      .single();

    if (roleError) {
      console.error("Error creating role:", roleError);
      return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
    }

    // Create audit log entry - use tenant-specific audit table
    await supabase.from("audit_logs").insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: "ROLE_CREATED",
      entity_type: "role",
      entity_id: role.id,
      details: {
        role_name: name,
        permissions: permissions || [],
        is_system_role: createAsSystemRole,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        is_system_role: role.is_system_role,
        is_active: role.is_active,
        requires_mfa: role.requires_mfa,
        permissions: role.permissions || [],
        user_count: 0,
        created_at: role.created_at,
        updated_at: role.updated_at,
        tenant_id: role.tenant_id,
      }
    });
  } catch (error) {
    console.error("Error in POST /api/admin/roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
