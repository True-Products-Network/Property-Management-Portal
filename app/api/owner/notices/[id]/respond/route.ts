// Owner Notice Response API
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

    const { id: noticeId } = await params;
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
      .from("compliance_responses")
      .insert({
        compliance_matter_id: noticeId,
        contact_id: contactData.id,
        response: body.response,
        created_at: new Date().toISOString(),
      });

    if (responseError) {
      throw responseError;
    }

    // Update compliance matter status
    await supabase
      .from("compliance_matters")
      .update({
        status: "response_received",
        response_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", noticeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
