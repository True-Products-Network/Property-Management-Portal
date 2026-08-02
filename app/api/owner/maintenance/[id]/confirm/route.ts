// Owner Maintenance Completion Confirmation API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: requestId } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Get contact ID for the current user
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this maintenance request
    const { data: maintenanceRequest, error: requestError } = await supabase
      .from("maintenance_requests")
      .select("id, status")
      .eq("id", requestId)
      .eq("reported_by_contact_id", contactData.id)
      .single();

    if (requestError || !maintenanceRequest) {
      return NextResponse.json(
        { success: false, error: "Request not found or access denied" },
        { status: 404 }
      );
    }

    // Create completion confirmation record
    const { error: confirmationError } = await supabase
      .from("maintenance_confirmations")
      .insert({
        maintenance_request_id: requestId,
        contact_id: contactData.id,
        is_resolved: body.isResolved,
        needs_more_work: body.needsMoreWork,
        area_acceptable: body.areaAcceptable,
        comments: body.comments,
        can_close: body.canClose,
        rating: body.rating,
        created_at: new Date().toISOString(),
      });

    if (confirmationError) {
      throw confirmationError;
    }

    // Update maintenance request status if appropriate
    if (body.canClose && body.isResolved && !body.needsMoreWork) {
      const { error: updateError } = await supabase
        .from("maintenance_requests")
        .update({
          status: "closed",
          owner_confirmed_at: new Date().toISOString(),
          owner_rating: body.rating,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        throw updateError;
      }
    } else if (body.needsMoreWork) {
      const { error: updateError } = await supabase
        .from("maintenance_requests")
        .update({
          status: "reopened",
          owner_follow_up_required: true,
          owner_comments: body.comments,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting completion confirmation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit confirmation" },
      { status: 500 }
    );
  }
}
