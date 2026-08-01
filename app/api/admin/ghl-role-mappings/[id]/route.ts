import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/admin/ghl-role-mappings/[id] - Update mapping
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
    const { ghlContactRole, portalRole, portalVersion, defaultPermissions, requiresMFA, status, description } = body;

    // Get current mapping for audit
    const { data: currentMapping } = await supabase
      .from("ghl_role_mappings")
      .select("*")
      .eq("id", id)
      .single();

    // Update mapping
    const { data: mapping, error: mappingError } = await supabase
      .from("ghl_role_mappings")
      .update({
        ghl_contact_role: ghlContactRole?.trim(),
        portal_role: portalRole?.trim(),
        portal_version: portalVersion?.trim(),
        default_permissions: defaultPermissions?.trim(),
        requires_mfa: requiresMFA,
        status: status,
        description: description?.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (mappingError) {
      console.error("Error updating mapping:", mappingError);
      return NextResponse.json({ error: "Failed to update mapping" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "GHL_MAPPING_UPDATED",
      entity_type: "ghl_role_mapping",
      entity_id: id,
      details: {
        ghl_contact_role: ghlContactRole,
        portal_role: portalRole,
        changes: {
          before: currentMapping,
          after: mapping,
        },
      },
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error("Error in PUT /api/admin/ghl-role-mappings/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/ghl-role-mappings/[id] - Delete mapping
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

    // Get mapping details for audit
    const { data: mapping } = await supabase
      .from("ghl_role_mappings")
      .select("ghl_contact_role, portal_role")
      .eq("id", id)
      .single();

    // Delete mapping
    const { error: deleteError } = await supabase
      .from("ghl_role_mappings")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting mapping:", deleteError);
      return NextResponse.json({ error: "Failed to delete mapping" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "GHL_MAPPING_DELETED",
      entity_type: "ghl_role_mapping",
      entity_id: id,
      details: {
        ghl_contact_role: mapping?.ghl_contact_role,
        portal_role: mapping?.portal_role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/ghl-role-mappings/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
