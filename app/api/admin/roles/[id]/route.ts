import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/roles/[id] - Get single role with permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Check if user is admin
    if (tenantUser.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Fetch role
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantUser.tenant_id}`)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Fetch permissions for this role
    const { data: permissions } = await supabase
      .from("role_permissions")
      .select("permission_code")
      .eq("role_id", role.id);

    // Get user count for this role
    const { count: userCount } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role_id", role.id)
      .eq("tenant_id", tenantUser.tenant_id);

    return NextResponse.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description || "",
        is_system_role: role.is_system_role,
        is_active: role.is_active,
        permissions: (permissions || []).map((p: { permission_code: string }) => p.permission_code),
        user_count: userCount || 0,
        created_at: role.created_at,
        updated_at: role.updated_at,
      }
    });
  } catch (error) {
    console.error("Error in GET /api/admin/roles/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Check if user is admin
    if (tenantUser.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, permissions, is_active } = body;

    // Check if role exists and belongs to this tenant (or is system role)
    const { data: existingRole, error: existingError } = await supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantUser.tenant_id}`)
      .single();

    if (existingError || !existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Cannot edit system roles
    if (existingRole.is_system_role) {
      return NextResponse.json({ error: "Cannot edit system roles" }, { status: 403 });
    }

    // Update role
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .update({
        name: name?.trim(),
        description: description?.trim(),
        is_active: is_active,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (roleError) {
      console.error("Error updating role:", roleError);
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }

    // Update permissions - first delete existing, then insert new
    if (permissions !== undefined) {
      // Delete existing permissions
      await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", id);

      // Insert new permissions
      if (permissions && permissions.length > 0) {
        const permissionInserts = permissions.map((code: string) => ({
          role_id: id,
          permission_code: code,
        }));

        const { error: permError } = await supabase
          .from("role_permissions")
          .insert(permissionInserts);

        if (permError) {
          console.error("Error updating permissions:", permError);
        }
      }
    }

    // Create audit log entry
    await supabase.from("platform_audit_events").insert({
      tenant_id: tenantUser.tenant_id,
      event_type: "ROLE_UPDATED",
      entity_type: "role",
      entity_id: id,
      details: {
        role_name: name,
        permissions: permissions || [],
      },
      created_by: user.id,
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error("Error in PUT /api/admin/roles/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Check if user is admin
    if (tenantUser.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Check if role exists and belongs to this tenant
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantUser.tenant_id)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Cannot delete system roles
    if (role.is_system_role) {
      return NextResponse.json({ error: "Cannot delete system roles" }, { status: 403 });
    }

    // Check if role is in use
    const { count, error: countError } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role_id", id);

    if (countError) {
      console.error("Error checking role usage:", countError);
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: "Cannot delete role that is assigned to users" },
        { status: 400 }
      );
    }

    // Delete role permissions first
    await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", id);

    // Delete role
    const { error: deleteError } = await supabase
      .from("roles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting role:", deleteError);
      return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("platform_audit_events").insert({
      tenant_id: tenantUser.tenant_id,
      event_type: "ROLE_DELETED",
      entity_type: "role",
      entity_id: id,
      details: {
        role_name: role.name,
      },
      created_by: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/roles/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
