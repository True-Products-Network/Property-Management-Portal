// Owner Preferences API
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
      .select(`
        id,
        email,
        phone,
        mobile_phone,
        preferred_contact_method,
        mailing_preference,
        email_permission,
        sms_permission,
        phone_permission,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        consent_date,
        consent_version
      `)
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    // Get portal notification preferences (stored in a separate table or JSON field)
    const { data: notificationPrefs } = await supabase
      .from("contact_notification_preferences")
      .select("*")
      .eq("contact_id", contactData.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        // Contact Methods
        email: contactData.email || "",
        phone: contactData.phone || "",
        mobilePhone: contactData.mobile_phone,
        
        // Preferred Contact Method
        preferredContactMethod: contactData.preferred_contact_method || "email",
        mailingPreference: contactData.mailing_preference || "email",
        
        // Communication Permissions
        emailPermission: contactData.email_permission || false,
        smsPermission: contactData.sms_permission || false,
        phonePermission: contactData.phone_permission || false,
        
        // Portal Notifications
        portalNotifications: notificationPrefs?.portal_notifications ?? true,
        maintenanceUpdates: notificationPrefs?.maintenance_updates ?? true,
        inspectionNotices: notificationPrefs?.inspection_notices ?? true,
        documentAlerts: notificationPrefs?.document_alerts ?? true,
        paymentReminders: notificationPrefs?.payment_reminders ?? true,
        generalAnnouncements: notificationPrefs?.general_announcements ?? true,
        
        // Emergency Contact
        emergencyContactName: contactData.emergency_contact_name,
        emergencyContactPhone: contactData.emergency_contact_phone,
        emergencyContactRelationship: contactData.emergency_contact_relationship,
        
        // Consent Tracking
        consentDate: contactData.consent_date,
        consentVersion: contactData.consent_version || "1.0",
      }
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch preferences" },
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

    // Update contact information
    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        email: body.email,
        phone: body.phone,
        mobile_phone: body.mobilePhone,
        preferred_contact_method: body.preferredContactMethod,
        mailing_preference: body.mailingPreference,
        email_permission: body.emailPermission,
        sms_permission: body.smsPermission,
        phone_permission: body.phonePermission,
        emergency_contact_name: body.emergencyContactName,
        emergency_contact_phone: body.emergencyContactPhone,
        emergency_contact_relationship: body.emergencyContactRelationship,
        consent_date: new Date().toISOString(),
        consent_version: "1.0",
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    if (updateError) {
      throw updateError;
    }

    // Update or insert notification preferences
    const { error: notifError } = await supabase
      .from("contact_notification_preferences")
      .upsert({
        contact_id: contactId,
        portal_notifications: body.portalNotifications,
        maintenance_updates: body.maintenanceUpdates,
        inspection_notices: body.inspectionNotices,
        document_alerts: body.documentAlerts,
        payment_reminders: body.paymentReminders,
        general_announcements: body.generalAnnouncements,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "contact_id"
      });

    if (notifError) {
      throw notifError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
