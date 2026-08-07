// Contact Portal Access API
// Toggle or update portal access status for a contact

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get current user session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'suspended', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get contact to verify it exists and get tenant_id for RLS
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, tenant_id, portal_user_id, email")
      .eq("id", id)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    // Update contact's portal invitation status
    const { data: updatedContact, error: updateError } = await supabase
      .from("contacts")
      .update({
        portal_invitation_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Portal Access API] Error updating contact:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update portal access" },
        { status: 500 }
      );
    }

    // If contact has a portal user and status is suspended, also suspend the portal user
    if (contact.portal_user_id && status === 'suspended') {
      const { error: portalUserError } = await supabase
        .from("portal_users")
        .update({ status: 'suspended' })
        .eq("id", contact.portal_user_id);

      if (portalUserError) {
        console.error("[Portal Access API] Error suspending portal user:", portalUserError);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedContact,
      message: `Portal access ${status}`,
    });
  } catch (error) {
    console.error("[Portal Access API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
