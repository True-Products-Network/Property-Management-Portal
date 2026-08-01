import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/admin/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = user.user_metadata?.roles || [];
    if (!userRoles.includes("ADMIN_USER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, permissions, requiresMFA, status, auditReason } = body;

    if (!auditReason?.trim()) {
      return NextResponse.json(
        { error: "Audit reason is required for role changes" },
        { status: 400 }
      );
    }

    // Get current role for audit comparison
    const { data: currentRole } = await supabase
      .from("portal_roles")
      .select("*")
      .eq("id", id)
      .single();

    // Update role
    const { data: role, error: roleError } = await supabase
      .from("portal_roles")
      .update({
        name: name?.trim(),
        description: description?.trim(),
        permissions: permissions,
        requires_mfa: requiresMFA,
        status: status,
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
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "ROLE_UPDATED",
      entity_type: "portal_role",
      entity_id: id,
      details: {
        role_name: name,
        reason: auditReason,
        changes: {
          before: currentRole,
          after: role,
        },
      },
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

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = user.user_metadata?.roles || [];
    if (!userRoles.includes("ADMIN_USER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Get role name for audit
    const { data: role } = await supabase
      .from("portal_roles")
      .select("name")
      .eq("id", id)
      .single();

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
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "ROLE_DELETED",
      entity_type: "portal_role",
      entity_id: id,
      details: {
        role_name: role?.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/roles/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
