// Owner Inspection Response API
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

    const { id: inspectionId } = await params;
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

    // Create response record
    const { error: responseError } = await supabase
      .from("inspection_owner_responses")
      .insert({
        inspection_id: inspectionId,
        contact_id: contactData.id,
        response: body.response,
        created_at: new Date().toISOString(),
      });

    if (responseError) {
      throw responseError;
    }

    // Update inspection
    await supabase
      .from("inspections")
      .update({
        owner_responded_at: new Date().toISOString(),
        requires_owner_action: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inspectionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting inspection response:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
