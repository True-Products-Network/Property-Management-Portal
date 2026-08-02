// Owner Notices API
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

    // Get properties and units for this contact
    const { data: contactRoles } = await supabase
      .from("contact_roles")
      .select("property_id, unit_id")
      .eq("contact_id", contactId)
      .eq("is_active", true);

    const propertyIds = [...new Set((contactRoles || []).map((r) => r.property_id).filter(Boolean))];
    const unitIds = [...new Set((contactRoles || []).map((r) => r.unit_id).filter(Boolean))];

    // Fetch compliance matters (notices) for these properties/units
    let query = supabase
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
        required_action
      `)
      .order("created_at", { ascending: false });

    if (propertyIds.length > 0) {
      query = query.in("property_id", propertyIds);
    }

    if (unitIds.length > 0) {
      query = query.in("unit_id", unitIds);
    }

    const { data: notices, error: noticesError } = await query;

    if (noticesError) {
      throw noticesError;
    }

    // Get property names
    const allPropertyIds = [...new Set((notices || []).map((n) => n.property_id).filter(Boolean))];
    const { data: properties } = allPropertyIds.length > 0
      ? await supabase
          .from("properties")
          .select("id, name")
          .in("id", allPropertyIds)
      : { data: [] };

    const propertyMap = new Map((properties || []).map((p) => [p.id, p.name]));

    // Get unit numbers
    const allUnitIds = [...new Set((notices || []).map((n) => n.unit_id).filter(Boolean))];
    const { data: units } = allUnitIds.length > 0
      ? await supabase
          .from("units")
          .select("id, unit_number")
          .in("id", allUnitIds)
      : { data: [] };

    const unitMap = new Map((units || []).map((u) => [u.id, u.unit_number]));

    const formattedNotices = (notices || []).map((notice) => {
      const isOverdue = notice.response_deadline
        ? new Date(notice.response_deadline) < new Date() && notice.status === "notice_sent"
        : false;

      return {
        id: notice.id,
        matterNumber: notice.matter_number,
        title: notice.title,
        type: notice.type,
        status: notice.status,
        date: notice.created_at,
        responseDeadline: notice.response_deadline,
        propertyName: propertyMap.get(notice.property_id) || "Unknown Property",
        unitNumber: unitMap.get(notice.unit_id),
        requiredAction: notice.required_action,
        isOverdue,
      };
    });

    return NextResponse.json({ success: true, data: formattedNotices });
  } catch (error) {
    console.error("Error fetching notices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}
