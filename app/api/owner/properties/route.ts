// Owner Properties API
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
      .select("id")
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json({ 
        success: true, 
        data: { properties: [], units: [] }
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

    // Fetch properties with association details
    let properties: any[] = [];
    if (propertyIds.length > 0) {
      const { data: propsData } = await supabase
        .from("properties")
        .select(`
          id, property_id, name, address_street, address_city, address_state, address_zip,
          type, status, year_built, total_units, management_start_date,
          access_instructions, emergency_notes, association_id
        `)
        .in("id", propertyIds);
      
      properties = propsData || [];
    }

    // Fetch associations for contact info
    const { data: associations } = associationIds.length > 0
      ? await supabase
          .from("associations")
          .select("id, name, phone, email")
          .in("id", associationIds)
      : { data: [] };

    const associationMap = new Map((associations || []).map((a: { id: string; name: string; phone: string; email: string }) => [a.id, a]));

    // Fetch units
    let units: any[] = [];
    if (unitIds.length > 0) {
      const { data: unitsData } = await supabase
        .from("units")
        .select(`
          id, unit_id, property_id, unit_number, display_name, type, status,
          square_feet, bedrooms, bathrooms, floor, occupancy_status, rental_status,
          parking_spot, storage_unit, move_in_date, mailing_address, access_notes
        `)
        .in("id", unitIds);
      
      units = unitsData || [];
    }

    // Create property map for unit lookups
    const propertyMap = new Map(properties.map((p: { id: string; name: string }) => [p.id, p.name]));

    return NextResponse.json({
      success: true,
      data: {
        properties: properties.map((p: { id: string; property_id: string; name: string; address_street: string; address_city: string; address_state: string; address_zip: string; type: string; status: string; year_built: number; total_units: number; management_start_date: string; access_instructions: string; emergency_notes: string; association_id: string }) => {
          const assoc = associationMap.get(p.association_id);
          return {
            id: p.id,
            propertyId: p.property_id,
            name: p.name,
            addressStreet: p.address_street,
            addressCity: p.address_city,
            addressState: p.address_state,
            addressZip: p.address_zip,
            type: p.type,
            status: p.status,
            yearBuilt: p.year_built,
            totalUnits: p.total_units,
            managementStartDate: p.management_start_date,
            accessInstructions: p.access_instructions,
            emergencyNotes: p.emergency_notes,
            associationId: p.association_id,
            associationName: assoc?.name,
            associationPhone: assoc?.phone,
            associationEmail: assoc?.email,
          };
        }),
        units: units.map((u: { id: string; unit_id: string; property_id: string; unit_number: string; display_name: string; type: string; status: string; square_feet: number; bedrooms: number; bathrooms: number; floor: string; occupancy_status: string; rental_status: string; parking_spot: string; storage_unit: string; move_in_date: string; mailing_address: string; access_notes: string }) => ({
          id: u.id,
          unitId: u.unit_id,
          propertyId: u.property_id,
          propertyName: propertyMap.get(u.property_id),
          unitNumber: u.unit_number,
          displayName: u.display_name,
          type: u.type,
          status: u.status,
          squareFeet: u.square_feet,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          floor: u.floor,
          occupancyStatus: u.occupancy_status,
          rentalStatus: u.rental_status,
          parkingSpot: u.parking_spot,
          storageUnit: u.storage_unit,
          moveInDate: u.move_in_date,
          mailingAddress: u.mailing_address,
          accessNotes: u.access_notes,
        })),
      },
    });
  } catch (error) {
    console.error("Error loading owner properties:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
