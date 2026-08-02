// Owner Documents API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get contact ID for the current user
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json({ success: true, data: [] });
    }

    const contactId = contactData.id;

    // Get property and unit IDs for this contact
    const { data: contactRoles } = await supabase
      .from("contact_roles")
      .select("property_id, unit_id")
      .eq("contact_id", contactId)
      .eq("is_active", true);

    const propertyIds = [...new Set((contactRoles || []).map(r => r.property_id).filter(Boolean))];
    const unitIds = [...new Set((contactRoles || []).map(r => r.unit_id).filter(Boolean))];

    // Build the query for documents
    let query = supabase
      .from("documents")
      .select(`
        id, document_id, title, file_name, file_path, file_size, content_type,
        document_type, category, status, issue_date, expiry_date,
        property_id, unit_id, contact_id, is_confidential, requires_acknowledgment,
        uploaded_by, created_at
      `)
      .eq("status", "active");

    // Filter for documents related to this contact
    const conditions: string[] = [];
    if (propertyIds.length > 0) {
      conditions.push(`property_id.in.(${propertyIds.join(",")})`);
    }
    if (unitIds.length > 0) {
      conditions.push(`unit_id.in.(${unitIds.join(",")})`);
    }
    conditions.push(`contact_id.eq.${contactId}`);
    
    query = query.or(conditions.join(","));

    const { data: documents, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Fetch property names
    const { data: properties } = propertyIds.length > 0
      ? await supabase
          .from("properties")
          .select("id, name")
          .in("id", propertyIds)
      : { data: [] };

    const propertyMap = new Map((properties || []).map(p => [p.id, p.name]));

    // Fetch unit numbers
    const { data: units } = unitIds.length > 0
      ? await supabase
          .from("units")
          .select("id, unit_number")
          .in("id", unitIds)
      : { data: [] };

    const unitMap = new Map((units || []).map(u => [u.id, u.unit_number]));

    // Fetch acknowledgments for this contact
    const documentIds = (documents || []).map(d => d.id);
    const { data: acknowledgments } = documentIds.length > 0
      ? await supabase
          .from("document_acknowledgments")
          .select("document_id, acknowledged_at")
          .eq("contact_id", contactId)
          .in("document_id", documentIds)
      : { data: [] };

    const acknowledgmentMap = new Map((acknowledgments || []).map(a => [a.document_id, a.acknowledged_at]));

    return NextResponse.json({
      success: true,
      data: (documents || []).map(d => ({
        id: d.id,
        documentId: d.document_id,
        title: d.title,
        fileName: d.file_name,
        filePath: d.file_path,
        fileSize: d.file_size,
        contentType: d.content_type,
        documentType: d.document_type,
        category: d.category,
        status: d.status,
        issueDate: d.issue_date,
        expiryDate: d.expiry_date,
        propertyId: d.property_id,
        propertyName: propertyMap.get(d.property_id),
        unitId: d.unit_id,
        unitNumber: unitMap.get(d.unit_id),
        isConfidential: d.is_confidential,
        requiresAcknowledgment: d.requires_acknowledgment,
        acknowledged: acknowledgmentMap.has(d.id),
        acknowledgedAt: acknowledgmentMap.get(d.id),
        createdAt: d.created_at,
      })),
    });
  } catch (error) {
    console.error("Error loading owner documents:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
