// Owner Document Acknowledgment API
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

    // Create acknowledgment record
    const { error: ackError } = await supabase
      .from("document_acknowledgments")
      .insert({
        document_id: documentId,
        contact_id: contactData.id,
        acknowledged_at: new Date().toISOString(),
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
      });

    if (ackError) {
      throw ackError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error acknowledging document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to acknowledge document" },
      { status: 500 }
    );
  }
}
