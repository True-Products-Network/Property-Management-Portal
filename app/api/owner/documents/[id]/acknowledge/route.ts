// Document Acknowledgment API - Updated for Next.js 15
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

    const supabase = await createClient();
    const { id: documentId } = await params;

    // Get contact ID for the current user
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    const contactId = contactData.id;

    // Verify the document exists and requires acknowledgment
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, requires_acknowledgment")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    if (!document.requires_acknowledgment) {
      return NextResponse.json({ success: false, error: "Document does not require acknowledgment" }, { status: 400 });
    }

    // Check if already acknowledged
    const { data: existingAck } = await supabase
      .from("document_acknowledgments")
      .select("id")
      .eq("document_id", documentId)
      .eq("contact_id", contactId)
      .single();

    if (existingAck) {
      return NextResponse.json({ success: true, message: "Already acknowledged" });
    }

    // Create acknowledgment
    const { error: insertError } = await supabase
      .from("document_acknowledgments")
      .insert({
        document_id: documentId,
        contact_id: contactId,
        acknowledged_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Document acknowledged successfully",
    });
  } catch (error) {
    console.error("Error acknowledging document:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
