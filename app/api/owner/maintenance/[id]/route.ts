// Owner Maintenance Request Detail API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const requestId = params.id;
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

    // Fetch maintenance request
    const { data: maintenanceRequest, error: requestError } = await supabase
      .from("maintenance_requests")
      .select(`
        id,
        request_number,
        title,
        status,
        urgency,
        description,
        property_id,
        unit_id,
        vendor_id,
        completed_at
      `)
      .eq("id", requestId)
      .eq("reported_by_contact_id", contactData.id)
      .single();

    if (requestError || !maintenanceRequest) {
      return NextResponse.json(
        { success: false, error: "Request not found or access denied" },
        { status: 404 }
      );
    }

    // Get property name
    const { data: property } = maintenanceRequest.property_id
      ? await supabase
          .from("properties")
          .select("name")
          .eq("id", maintenanceRequest.property_id)
          .single()
      : { data: null };

    // Get unit number
    const { data: unit } = maintenanceRequest.unit_id
      ? await supabase
          .from("units")
          .select("unit_number")
          .eq("id", maintenanceRequest.unit_id)
          .single()
      : { data: null };

    // Get vendor name
    const { data: vendor } = maintenanceRequest.vendor_id
      ? await supabase
          .from("vendors")
          .select("company_name")
          .eq("id", maintenanceRequest.vendor_id)
          .single()
      : { data: null };

    const formattedRequest = {
      id: maintenanceRequest.id,
      requestNumber: maintenanceRequest.request_number,
      title: maintenanceRequest.title,
      status: maintenanceRequest.status,
      urgency: maintenanceRequest.urgency,
      description: maintenanceRequest.description,
      propertyName: property?.name || "Unknown Property",
      unitNumber: unit?.unit_number,
      vendorName: vendor?.company_name,
      completedAt: maintenanceRequest.completed_at,
    };

    return NextResponse.json({
      success: true,
      data: formattedRequest,
    });
  } catch (error) {
    console.error("Error fetching maintenance request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch maintenance request" },
      { status: 500 }
    );
  }
}
