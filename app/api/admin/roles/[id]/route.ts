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
      .limit(1)
      .maybeSingle();

    if (!isPlatformAdmin && !tenantUser) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Check if user is admin
    const isTenantAdmin = tenantUser?.role === 'admin';
    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Fetch role from portal_roles
    const { data: role, error: roleError } = await supabase
      .from("portal_roles")
      .select("*")
      .eq("id", id)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description || "",
        is_system_role: role.is_default,
        is_active: role.status === 'active',
        requires_mfa: role.requires_mfa,
        permissions: role.permissions || [],
        user_count: role.user_count || 0,
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
      .limit(1)
      .maybeSingle();

    if (!isPlatformAdmin && !tenantUser) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Check if user is admin
    const isTenantAdmin = tenantUser?.role === 'admin';
    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, permissions, is_active, requires_mfa } = body;

    // Check if role exists
    const { data: existingRole, error: existingError } = await supabase
      .from("portal_roles")
      .select("*")
      .eq("id", id)
      .single();

    if (existingError || !existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Cannot edit system roles
    if (existingRole.is_default) {
      return NextResponse.json({ error: "Cannot edit system roles" }, { status: 403 });
    }

    // Update role
    const { data: role, error: roleError } = await supabase
      .from("portal_roles")
      .update({
        name: name?.trim(),
        description: description?.trim(),
        permissions: permissions,
        status: is_active ? 'active' : 'inactive',
        requires_mfa: requires_mfa,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (roleError) {
      console.error("Error updating role:", roleError);
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("platform_audit_events").insert({
      tenant_id: tenantUser?.tenant_id || '00000000-0000-0000-0000-000000000000',
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
      .limit(1)
      .maybeSingle();

    if (!isPlatformAdmin && !tenantUser) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Check if user is admin
    const isTenantAdmin = tenantUser?.role === 'admin';
    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Check if role exists
    const { data: role, error: roleError } = await supabase
      .from("portal_roles")
      .select("*")
      .eq("id", id)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Cannot delete system roles
    if (role.is_default) {
      return NextResponse.json({ error: "Cannot delete system roles" }, { status: 403 });
    }

    // Check if role is in use
    if (role.user_count > 0) {
      return NextResponse.json(
        { error: `Cannot delete role that is assigned to ${role.user_count} user(s)` },
        { status: 400 }
      );
    }

    // Delete role
    const { error: deleteError } = await supabase
      .from("portal_roles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting role:", deleteError);
      return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("platform_audit_events").insert({
      tenant_id: tenantUser?.tenant_id || '00000000-0000-0000-0000-000000000000',
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
