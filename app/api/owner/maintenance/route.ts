// Owner Maintenance API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface ContactRole {
  property_id: string | null;
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

    // Get property IDs for this contact to fetch property names
    const { data: contactRoles } = await supabase
      .from("contact_roles")
      .select("property_id")
      .eq("contact_id", contactId)
      .eq("is_active", true);

    const typedContactRoles = (contactRoles || []) as ContactRole[];
    const propertyIds = [...new Set(typedContactRoles.map((r: ContactRole) => r.property_id).filter(Boolean))];

    // Fetch property names
    const { data: properties } = propertyIds.length > 0
      ? await supabase
          .from("properties")
          .select("id, name")
          .in("id", propertyIds)
      : { data: [] };

    const propertyMap = new Map((properties || []).map((p: { id: string; name: string }) => [p.id, p.name]));

    // Fetch unit numbers
    const { data: units } = propertyIds.length > 0
      ? await supabase
          .from("units")
          .select("id, unit_number")
          .in("property_id", propertyIds)
      : { data: [] };

    const unitMap = new Map((units || []).map((u: { id: string; unit_number: string }) => [u.id, u.unit_number]));

    // Fetch vendor names
    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, company_name");

    const vendorMap = new Map((vendors || []).map((v: { id: string; company_name: string }) => [v.id, v.company_name]));

    // Fetch maintenance requests for this contact
    const { data: maintenanceRequests, error } = await supabase
      .from("maintenance_requests")
      .select(`
        id, request_number, title, description, status, urgency, category,
        property_id, unit_id, assigned_vendor_id, requested_date, scheduled_date,
        completed_date, created_at, updated_at
      `)
      .eq("reported_by_contact_id", contactId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: (maintenanceRequests || []).map((m: { id: string; request_number: string; title: string; description: string; status: string; urgency: string; category: string; property_id: string; unit_id: string; assigned_vendor_id: string; requested_date: string; scheduled_date: string; completed_date: string; created_at: string; updated_at: string }) => ({
        id: m.id,
        requestNumber: m.request_number,
        title: m.title,
        description: m.description,
        status: m.status,
        urgency: m.urgency,
        category: m.category,
        propertyId: m.property_id,
        propertyName: propertyMap.get(m.property_id),
        unitId: m.unit_id,
        unitNumber: unitMap.get(m.unit_id),
        assignedVendorId: m.assigned_vendor_id,
        assignedVendorName: vendorMap.get(m.assigned_vendor_id),
        requestedDate: m.requested_date,
        scheduledDate: m.scheduled_date,
        completedDate: m.completed_date,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      })),
    });
  } catch (error) {
    console.error("Error loading owner maintenance requests:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
