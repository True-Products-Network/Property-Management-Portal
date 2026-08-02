// Owner Inspection Detail API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface Document {
  id: string;
  title: string;
  document_type: string;
  created_at: string;
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

    const { id: inspectionId } = await params;
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

    // Fetch inspection
    const { data: inspection, error: inspectionError } = await supabase
      .from("inspections")
      .select(`
        id,
        inspection_number,
        type,
        status,
        result,
        scheduled_date,
        completed_date,
        property_id,
        unit_id,
        inspector_name,
        findings,
        recommendations,
        owner_instructions,
        requires_owner_action,
        owner_action_required,
        owner_action_deadline
      `)
      .eq("id", inspectionId)
      .single();

    if (inspectionError || !inspection) {
      return NextResponse.json(
        { success: false, error: "Inspection not found" },
        { status: 404 }
      );
    }

    // Get property name
    const { data: property } = await supabase
      .from("properties")
      .select("name")
      .eq("id", inspection.property_id)
      .single();

    // Get unit number
    const { data: unit } = inspection.unit_id
      ? await supabase
          .from("units")
          .select("unit_number")
          .eq("id", inspection.unit_id)
          .single()
      : { data: null };

    // Get related documents
    const { data: documents } = await supabase
      .from("documents")
      .select("id, title, document_type, created_at")
      .eq("related_inspection_id", inspectionId)
      .eq("is_confidential", false);

    const formattedInspection = {
      id: inspection.id,
      inspectionNumber: inspection.inspection_number,
      type: inspection.type,
      status: inspection.status,
      result: inspection.result,
      scheduledDate: inspection.scheduled_date,
      completedDate: inspection.completed_date,
      propertyName: property?.name || "Unknown Property",
      unitNumber: unit?.unit_number,
      inspectorName: inspection.inspector_name,
      findings: inspection.findings,
      recommendations: inspection.recommendations,
      ownerInstructions: inspection.owner_instructions,
      requiresAction: inspection.requires_owner_action || false,
      ownerActionRequired: inspection.owner_action_required,
      ownerActionDeadline: inspection.owner_action_deadline,
    };

    const formattedDocuments = (documents || []).map((doc: Document) => ({
      id: doc.id,
      title: doc.title,
      documentType: doc.document_type,
      uploadedAt: doc.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        inspection: formattedInspection,
        documents: formattedDocuments,
      },
    });
  } catch (error) {
    console.error("Error fetching inspection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inspection" },
      { status: 500 }
    );
  }
}
