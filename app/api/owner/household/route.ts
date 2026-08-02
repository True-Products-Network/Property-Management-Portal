// Owner Household API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface ContactRole {
  unit_id: string | null;
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
        data: {
          occupancyStatus: "owner_occupied",
          occupants: [],
          pets: [],
          vehicles: [],
          preferredContactMethod: "email",
          emailNotifications: true,
          smsNotifications: false,
          portalNotifications: true,
        }
      });
    }

    const contactId = contactData.id;

    // Get units for this contact
    const { data: contactRoles } = await supabase
      .from("contact_roles")
      .select("unit_id")
      .eq("contact_id", contactId)
      .eq("is_active", true);

    const typedContactRoles = (contactRoles || []) as ContactRole[];
    const unitIds = [...new Set(typedContactRoles.map((r) => r.unit_id).filter(Boolean))];

    // Get household data from first unit (simplified for now)
    // In production, this would be a separate household/occupancy table
    const { data: units } = unitIds.length > 0
      ? await supabase
          .from("units")
          .select("id, unit_number, occupancy_status, move_in_date, move_out_date, mailing_address, mailing_city, mailing_state, mailing_zip")
          .in("id", unitIds)
          .limit(1)
      : { data: [] };

    const unit = units?.[0];

    // Get contact details for emergency info
    const { data: contact } = await supabase
      .from("contacts")
      .select("emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, preferred_contact_method, email_permission, sms_permission")
      .eq("id", contactId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        occupancyStatus: unit?.occupancy_status || "owner_occupied",
        moveInDate: unit?.move_in_date,
        moveOutDate: unit?.move_out_date,
        mailingAddress: unit?.mailing_address,
        mailingCity: unit?.mailing_city,
        mailingState: unit?.mailing_state,
        mailingZip: unit?.mailing_zip,
        emergencyContactName: contact?.emergency_contact_name,
        emergencyContactPhone: contact?.emergency_contact_phone,
        emergencyContactRelationship: contact?.emergency_contact_relationship,
        occupants: [], // Would come from a household_members table
        pets: [], // Would come from a pets table
        vehicles: [], // Would come from a vehicles table
        preferredContactMethod: contact?.preferred_contact_method || "email",
        emailNotifications: contact?.email_permission || false,
        smsNotifications: contact?.sms_permission || false,
        portalNotifications: true,
      }
    });
  } catch (error) {
    console.error("Error fetching household data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch household data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
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

    const contactId = contactData.id;

    // Update contact with emergency info and preferences
    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        emergency_contact_name: body.emergencyContactName,
        emergency_contact_phone: body.emergencyContactPhone,
        emergency_contact_relationship: body.emergencyContactRelationship,
        preferred_contact_method: body.preferredContactMethod,
        email_permission: body.emailNotifications,
        sms_permission: body.smsNotifications,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    if (updateError) {
      throw updateError;
    }

    // Get units for this contact and update them
    const { data: contactRoles } = await supabase
      .from("contact_roles")
      .select("unit_id")
      .eq("contact_id", contactId)
      .eq("is_active", true);

    const typedContactRoles = (contactRoles || []) as ContactRole[];
    const unitIds = [...new Set(typedContactRoles.map((r) => r.unit_id).filter(Boolean))];

    if (unitIds.length > 0) {
      const { error: unitUpdateError } = await supabase
        .from("units")
        .update({
          occupancy_status: body.occupancyStatus,
          move_in_date: body.moveInDate,
          move_out_date: body.moveOutDate,
          mailing_address: body.mailingAddress,
          mailing_city: body.mailingCity,
          mailing_state: body.mailingState,
          mailing_zip: body.mailingZip,
          updated_at: new Date().toISOString(),
        })
        .in("id", unitIds);

      if (unitUpdateError) {
        throw unitUpdateError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating household data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update household data" },
      { status: 500 }
    );
  }
}
