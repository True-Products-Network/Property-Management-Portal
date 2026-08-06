import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/admin/users/[id]/status - Update user status (active, suspended, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: currentUser } = await supabase
      .from("portal_users")
      .select("is_admin")
      .eq("id", authUser.id)
      .maybeSingle();

    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .is("revoked_at", null)
      .maybeSingle();

    const isAdmin = currentUser?.is_admin || platformRole?.role === "PLATFORM_ADMIN";

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Update contact's portal invitation status
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .update({
        portal_invitation_status: status.toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("portal_user_id", id)
      .select()
      .single();

    if (contactError) {
      console.error("Error updating contact status:", contactError);
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }

    // Also update portal_users status if exists
    const { error: portalError } = await supabase
      .from("portal_users")
      .update({
        status: status.toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (portalError) {
      console.error("Error updating portal user status:", portalError);
      // Don't fail if portal_users update fails, contact is the main record
    }

    // Create audit log entry
    await supabase.from("platform_audit_events").insert({
      event_type: "USER_STATUS_UPDATED",
      entity_type: "user",
      entity_id: id,
      details: {
        new_status: status,
        updated_by: authUser.id,
      },
      created_by: authUser.id,
    });

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/users/[id]/status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
