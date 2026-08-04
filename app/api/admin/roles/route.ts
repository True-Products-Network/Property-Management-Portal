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

    // Check if user is platform admin (from user_metadata) or tenant admin
    const isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    
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

    // Fetch system roles (tenant_id IS NULL) and tenant-specific roles
    const { data: roles, error: rolesError } = await supabase
      .from("roles")
      .select("*")
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .order("is_system_role", { ascending: false })
      .order("name");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }

    // Fetch permissions for each role
    interface Role {
      id: string;
      name: string;
      description: string | null;
      is_system_role: boolean;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }
    const rolesWithPermissions = await Promise.all(
      (roles || []).map(async (role: Role) => {
        const { data: permissions } = await supabase
          .from("role_permissions")
          .select("permission_code")
          .eq("role_id", role.id);

        // Get user count for this role
        const { count: userCount } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role_id", role.id)
          .eq("tenant_id", tenantId);

        return {
          id: role.id,
          name: role.name,
          description: role.description || "",
          is_system_role: role.is_system_role,
          is_active: role.is_active,
          permissions: (permissions || []).map((p: { permission_code: string }) => p.permission_code),
          user_count: userCount || 0,
          created_at: role.created_at,
          updated_at: role.updated_at,
        };
      })
    );

    return NextResponse.json({ success: true, data: rolesWithPermissions });
  } catch (error) {
    console.error("Error in GET /api/admin/roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is platform admin (from user_metadata) or tenant admin
    const isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    
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

    const body = await request.json();
    const { name, description, permissions, is_active } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Check if role name already exists for this tenant
    const { data: existingRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", name.trim())
      .eq("tenant_id", tenantId)
      .limit(1)
      .single();

    if (existingRole) {
      return NextResponse.json({ error: "Role with this name already exists" }, { status: 400 });
    }

    // Insert role
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .insert({
        name: name.trim(),
        description: description?.trim() || "",
        tenant_id: tenantId,
        is_system_role: false,
        is_active: is_active !== false,
        created_by: user.id,
      })
      .select()
      .single();

    if (roleError) {
      console.error("Error creating role:", roleError);
      return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
    }

    // Insert role permissions
    if (permissions && permissions.length > 0) {
      const permissionInserts = permissions.map((code: string) => ({
        role_id: role.id,
        permission_code: code,
      }));

      const { error: permError } = await supabase
        .from("role_permissions")
        .insert(permissionInserts);

      if (permError) {
        console.error("Error inserting permissions:", permError);
      }
    }

    // Create audit log entry
    await supabase.from("platform_audit_events").insert({
      tenant_id: tenantId,
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
        permissions: permissions || [],
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
