import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GHL Invitation Webhook
 * 
 * This endpoint sends user invitation emails via GHL
 * when a new user is invited to the portal.
 */

interface InvitePayload {
  email: string;
  firstName?: string;
  lastName?: string;
  invitationToken: string;
  tenantName: string;
  invitationUrl: string;
}

export async function POST(request: Request) {
  try {
    const payload: InvitePayload = await request.json();
    
    console.log("GHL Invitation webhook received:", {
      email: payload.email,
      tenantName: payload.tenantName,
    });

    const supabase = await createClient();

    // Get GHL credentials from settings
    const { data: locationSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ghl_location_id")
      .single();

    const { data: tokenSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ghl_api_token")
      .single();

    if (!locationSetting?.value || !tokenSetting?.value) {
      console.error("GHL not configured - cannot send invitation");
      return NextResponse.json(
        { success: false, error: "GHL not configured" },
        { status: 400 }
      );
    }

    // Create or update contact in GHL
    const contactResponse = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenSetting.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: payload.email,
        firstName: payload.firstName || "",
        lastName: payload.lastName || "",
        tags: ["portal_invited", "portal_user"],
        customFields: [
          {
            id: "invitation_token",
            value: payload.invitationToken,
          },
          {
            id: "tenant_name",
            value: payload.tenantName,
          },
        ],
      }),
    });

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error("GHL API error creating contact:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to create contact in GHL" },
        { status: 500 }
      );
    }

    const contactData = await contactResponse.json();
    console.log("Contact created in GHL:", contactData.contact?.id);

    // Send email via GHL
    // Option 1: Trigger a workflow
    // Option 2: Send direct email (if GHL supports it)
    
    // For now, we'll return success and let the admin trigger emails via GHL workflows
    // The contact is created with tags that can trigger workflows

    return NextResponse.json({
      success: true,
      message: "Contact created in GHL successfully",
      contactId: contactData.contact?.id,
      note: "Email will be sent via GHL workflow triggered by 'portal_invited' tag",
    });
  } catch (error) {
    console.error("Error processing GHL invitation webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
