// Owner Document Message API
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

    const { id: documentId } = await params;
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

    // Create message
    const { error: messageError } = await supabase
      .from("document_messages")
      .insert({
        document_id: documentId,
        contact_id: contactData.id,
        message: body.message,
        created_at: new Date().toISOString(),
      });

    if (messageError) {
      throw messageError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending document message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
