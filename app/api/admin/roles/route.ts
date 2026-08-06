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

    // Use tenant_id from tenantUser or a default for platform admins
    const tenantId = tenantUser?.tenant_id || '00000000-0000-0000-0000-000000000000';

    // Fetch all roles (system-wide and tenant-specific)
    const { data: roles, error: rolesError } = await supabase
      .from("roles")
      .select("*")
      .order("is_system_role", { ascending: false })
      .order("name");

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

    // Parse request body
    const body = await request.json();
    const { name, description, permissions, is_active, requires_mfa } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Check if role name already exists for this tenant
    const { data: existingRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", name.trim())
      .eq("tenant_id", tenantId || 'system')
      .limit(1)
      .single();

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
        is_system_role: false,
        requires_mfa: requires_mfa || false,
        is_active: is_active !== false,
        tenant_id: tenantId,
        created_by: user.id,
      })
      .select()
      .single();

    if (roleError) {
      console.error("Error creating role:", roleError);
      return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("platform_audit_events").insert({
      tenant_id: tenantId || '00000000-0000-0000-0000-000000000000',
      event_type: "ROLE_CREATED",
      entity_type: "role",
      entity_id: role.id,
      details: {
        role_name: name,
        permissions: permissions || [],
      },
      created_by: user.id,
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
      }
    });
  } catch (error) {
    console.error("Error in POST /api/admin/roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
