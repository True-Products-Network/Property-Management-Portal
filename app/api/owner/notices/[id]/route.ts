// Owner Notice Detail API
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

    const { id: noticeId } = await params;
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

    // Fetch compliance matter (notice)
    const { data: notice, error: noticeError } = await supabase
      .from("compliance_matters")
      .select(`
        id,
        matter_number,
        title,
        type,
        status,
        created_at,
        response_deadline,
        property_id,
        unit_id,
        rule_reference,
        factual_description,
        evidence,
        required_action,
        hearing_date,
        hearing_location,
        corrective_action,
        resolution
      `)
      .eq("id", noticeId)
      .single();

    if (noticeError || !notice) {
      return NextResponse.json(
        { success: false, error: "Notice not found" },
        { status: 404 }
      );
    }

    // Get property name
    const { data: property } = notice.property_id
      ? await supabase
          .from("properties")
          .select("name")
          .eq("id", notice.property_id)
          .single()
      : { data: null };

    // Get unit number
    const { data: unit } = notice.unit_id
      ? await supabase
          .from("units")
          .select("unit_number")
          .eq("id", notice.unit_id)
          .single()
      : { data: null };

    // Get related documents
    const { data: documents } = await supabase
      .from("documents")
      .select("id, title, document_type, created_at")
      .eq("related_compliance_id", noticeId)
      .eq("is_confidential", false);

    const isOverdue = notice.response_deadline
      ? new Date(notice.response_deadline) < new Date() && notice.status === "notice_sent"
      : false;

    const formattedNotice = {
      id: notice.id,
      matterNumber: notice.matter_number,
      title: notice.title,
      type: notice.type,
      status: notice.status,
      date: notice.created_at,
      responseDeadline: notice.response_deadline,
      propertyName: property?.name || "Unknown Property",
      unitNumber: unit?.unit_number,
      ruleReference: notice.rule_reference,
      factualDescription: notice.factual_description,
      evidence: notice.evidence,
      requiredAction: notice.required_action,
      isOverdue,
      hearingDate: notice.hearing_date,
      hearingLocation: notice.hearing_location,
      correctiveAction: notice.corrective_action,
      resolution: notice.resolution,
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
        notice: formattedNotice,
        documents: formattedDocuments,
      },
    });
  } catch (error) {
    console.error("Error fetching notice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notice" },
      { status: 500 }
    );
  }
}
