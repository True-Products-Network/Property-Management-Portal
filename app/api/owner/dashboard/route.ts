// Owner Dashboard API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface ContactRole {
  property_id: string | null;
  unit_id: string | null;
  association_id: string | null;
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
      .select("id, first_name, last_name")
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json({ 
        success: true, 
        data: {
          contactId: "",
          firstName: "",
          lastName: "",
          properties: [],
          units: [],
          maintenanceRequests: [],
          documents: [],
          payments: [],
          upcomingAppointments: [],
          outstandingBalance: 0,
        }
      });
    }

    const contactId = contactData.id;

    // Get properties and units through contact_roles
    const { data: contactRoles } = await supabase
      .from("contact_roles")
      .select("property_id, unit_id, association_id")
      .eq("contact_id", contactId)
      .eq("is_active", true);

    const typedContactRoles = (contactRoles || []) as ContactRole[];
    const propertyIds = [...new Set(typedContactRoles.map((r: ContactRole) => r.property_id).filter(Boolean))];
    const unitIds = [...new Set(typedContactRoles.map((r: ContactRole) => r.unit_id).filter(Boolean))];
    const associationIds = [...new Set(typedContactRoles.map((r: ContactRole) => r.association_id).filter(Boolean))];

    // Fetch properties
    const { data: properties } = propertyIds.length > 0
      ? await supabase
          .from("properties")
          .select("id, name, address_street, address_city, address_state, type, status, association_id")
          .in("id", propertyIds)
      : { data: [] };

    // Fetch associations for property names
    const { data: associations } = associationIds.length > 0
      ? await supabase
          .from("associations")
          .select("id, name")
          .in("id", associationIds)
      : { data: [] };

    const associationMap = new Map((associations || []).map(a => [a.id, a.name]));

    // Fetch units
    const { data: units } = unitIds.length > 0
      ? await supabase
          .from("units")
          .select("id, unit_id, property_id, unit_number, display_name, type, status, occupancy_status")
          .in("id", unitIds)
      : { data: [] };

    // Create property map for unit lookups
    const propertyMap = new Map((properties || []).map(p => [p.id, p.name]));

    // Fetch maintenance requests for this contact
    const { data: maintenanceRequests } = await supabase
      .from("maintenance_requests")
      .select("id, request_number, title, status, urgency, category, property_id, unit_id, created_at")
      .eq("reported_by_contact_id", contactId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch documents related to this contact's properties/units
    const { data: documents } = await supabase
      .from("documents")
      .select("id, title, document_type, category, created_at, requires_acknowledgment, property_id, unit_id")
      .or(`property_id.in.(${propertyIds.join(",")}),unit_id.in.(${unitIds.join(",")}),contact_id.eq.${contactId}`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch payments for this contact
    const { data: payments } = await supabase
      .from("payment_records")
      .select("id, amount, status, payment_type, initiated_at, invoice_number")
      .eq("contact_id", contactId)
      .order("initiated_at", { ascending: false })
      .limit(5);

    // Fetch upcoming appointments
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, title, start_time, appointment_type, is_virtual")
      .eq("contact_id", contactId)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(3);

    // Calculate outstanding balance
    const outstandingBalance = (payments || [])
      .filter(p => p.status === "pending" || p.status === "invoiced")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        contactId,
        firstName: contactData.first_name,
        lastName: contactData.last_name,
        properties: (properties || []).map(p => ({
          id: p.id,
          name: p.name,
          addressStreet: p.address_street,
          addressCity: p.address_city,
          addressState: p.address_state,
          type: p.type,
          associationName: associationMap.get(p.association_id),
        })),
        units: (units || []).map(u => ({
          id: u.id,
          unitId: u.unit_id,
          propertyId: u.property_id,
          propertyName: propertyMap.get(u.property_id),
          unitNumber: u.unit_number,
          displayName: u.display_name,
          type: u.type,
          status: u.status,
          occupancyStatus: u.occupancy_status,
        })),
        maintenanceRequests: (maintenanceRequests || []).map(m => ({
          id: m.id,
          requestNumber: m.request_number,
          title: m.title,
          status: m.status,
          urgency: m.urgency,
          category: m.category,
          propertyId: m.property_id,
          propertyName: propertyMap.get(m.property_id),
          unitId: m.unit_id,
          createdAt: m.created_at,
        })),
        documents: (documents || []).map(d => ({
          id: d.id,
          title: d.title,
          documentType: d.document_type,
          category: d.category,
          createdAt: d.created_at,
          requiresAcknowledgment: d.requires_acknowledgment,
          acknowledged: false, // TODO: Check document_acknowledgments table
        })),
        payments: (payments || []).map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          paymentType: p.payment_type,
          initiatedAt: p.initiated_at,
          invoiceNumber: p.invoice_number,
        })),
        upcomingAppointments: (appointments || []).map(a => ({
          id: a.id,
          title: a.title,
          startTime: a.start_time,
          appointmentType: a.appointment_type,
          isVirtual: a.is_virtual,
        })),
        outstandingBalance,
      },
    });
  } catch (error) {
    console.error("Error loading owner dashboard:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
