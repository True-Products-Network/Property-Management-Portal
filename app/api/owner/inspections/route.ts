// Owner Inspections API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface ContactRole {
  property_id: string | null;
  unit_id: string | null;
}

interface Inspection {
  id: string;
  inspection_number: string;
  type: string;
  status: string;
  result: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  property_id: string;
  unit_id: string | null;
  inspector_name: string | null;
  requires_owner_action: boolean | null;
  owner_action_required: string | null;
  owner_action_deadline: string | null;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unit_number: string;
}

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

    const typedContactRoles = (contactRoles || []) as ContactRole[];
    const propertyIds = [...new Set(typedContactRoles.map((r) => r.property_id).filter(Boolean))];
    const unitIds = [...new Set(typedContactRoles.map((r) => r.unit_id).filter(Boolean))];

    // Fetch inspections for these properties/units
    let query = supabase
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
        requires_owner_action,
        owner_action_required,
        owner_action_deadline
      `)
      .order("scheduled_date", { ascending: false });

    if (propertyIds.length > 0) {
      query = query.in("property_id", propertyIds);
    }

    if (unitIds.length > 0) {
      query = query.in("unit_id", unitIds);
    }

    const { data: inspections, error: inspectionsError } = await query;

    if (inspectionsError) {
      throw inspectionsError;
    }

    // Get property names
    const allPropertyIds = [...new Set((inspections || []).map((i: Inspection) => i.property_id).filter(Boolean))];
    const { data: properties } = allPropertyIds.length > 0
      ? await supabase
          .from("properties")
          .select("id, name")
          .in("id", allPropertyIds)
      : { data: [] };

    const propertyMap = new Map((properties || []).map((p: Property) => [p.id, p.name]));

    // Get unit numbers
    const allUnitIds = [...new Set((inspections || []).map((i: Inspection) => i.unit_id).filter(Boolean))];
    const { data: units } = allUnitIds.length > 0
      ? await supabase
          .from("units")
          .select("id, unit_number")
          .in("id", allUnitIds)
      : { data: [] };

    const unitMap = new Map((units || []).map((u: Unit) => [u.id, u.unit_number]));

    const formattedInspections = (inspections || []).map((inspection: Inspection) => ({
      id: inspection.id,
      inspectionNumber: inspection.inspection_number,
      type: inspection.type,
      status: inspection.status,
      result: inspection.result,
      scheduledDate: inspection.scheduled_date,
      completedDate: inspection.completed_date,
      propertyName: propertyMap.get(inspection.property_id) || "Unknown Property",
      unitNumber: unitMap.get(inspection.unit_id),
      inspectorName: inspection.inspector_name,
      requiresAction: inspection.requires_owner_action || false,
      ownerActionRequired: inspection.owner_action_required,
      ownerActionDeadline: inspection.owner_action_deadline,
    }));

    return NextResponse.json({ success: true, data: formattedInspections });
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inspections" },
      { status: 500 }
    );
  }
}
