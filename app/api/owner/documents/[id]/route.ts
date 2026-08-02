// Owner Document Detail API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface ContactRole {
  property_id: string | null;
  unit_id: string | null;
}

export async function GET(
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
      .select("id, first_name, last_name")
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    // Fetch document
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select(`
        id,
        document_id,
        title,
        file_name,
        file_path,
        document_type,
        category,
        status,
        issue_date,
        expiry_date,
        property_id,
        unit_id,
        uploaded_by,
        created_at,
        version,
        is_confidential,
        requires_acknowledgment,
        description
      `)
      .eq("id", documentId)
      .eq("is_confidential", false)
      .single();

    if (documentError || !document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this document
    const { data: contactRoles } = await supabase
      .from("contact_roles")
      .select("property_id, unit_id")
      .eq("contact_id", contactData.id)
      .eq("is_active", true);

    const typedContactRoles = (contactRoles || []) as ContactRole[];
    const userPropertyIds = typedContactRoles.map((r) => r.property_id).filter(Boolean);
    const userUnitIds = typedContactRoles.map((r) => r.unit_id).filter(Boolean);

    const hasAccess =
      userPropertyIds.includes(document.property_id) ||
      userUnitIds.includes(document.unit_id) ||
      (!document.property_id && !document.unit_id);

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Get property name
    const { data: property } = document.property_id
      ? await supabase
          .from("properties")
          .select("name")
          .eq("id", document.property_id)
          .single()
      : { data: null };

    // Get unit number
    const { data: unit } = document.unit_id
      ? await supabase
          .from("units")
          .select("unit_number")
          .eq("id", document.unit_id)
          .single()
      : { data: null };

    // Get uploader name
    const { data: uploader } = document.uploaded_by
      ? await supabase
          .from("contacts")
          .select("first_name, last_name")
          .eq("id", document.uploaded_by)
          .single()
      : { data: null };

    // Check acknowledgment status
    const { data: acknowledgment } = await supabase
      .from("document_acknowledgments")
      .select("acknowledged_at")
      .eq("document_id", documentId)
      .eq("contact_id", contactData.id)
      .single();

    // Get messages
    const { data: messages } = await supabase
      .from("document_messages")
      .select("id, message, created_at, contact_id")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    const formattedDocument = {
      id: document.id,
      documentId: document.document_id,
      title: document.title,
      fileName: document.file_name,
      filePath: document.file_path,
      documentType: document.document_type,
      category: document.category,
      status: document.status,
      issueDate: document.issue_date,
      expiryDate: document.expiry_date,
      propertyName: property?.name,
      unitNumber: unit?.unit_number,
      uploadedBy: uploader ? `${uploader.first_name} ${uploader.last_name}` : "Management",
      uploadedAt: document.created_at,
      version: document.version || "1.0",
      isConfidential: document.is_confidential,
      requiresAcknowledgment: document.requires_acknowledgment,
      acknowledged: !!acknowledgment,
      acknowledgedAt: acknowledgment?.acknowledged_at,
      description: document.description,
    };

    const formattedMessages = (messages || []).map((msg) => ({
      id: msg.id,
      sender: msg.contact_id === contactData.id ? "You" : "Management",
      message: msg.message,
      createdAt: msg.created_at,
      isOwner: msg.contact_id === contactData.id,
    }));

    return NextResponse.json({
      success: true,
      data: {
        document: formattedDocument,
        messages: formattedMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}
