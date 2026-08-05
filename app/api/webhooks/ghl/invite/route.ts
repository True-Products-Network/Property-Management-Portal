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

    const token = tokenSetting.value;
    const locationId = locationSetting.value;

    // Try GHL v2 API first
    let contactId: string | null = null;
    let v2Success = false;

    try {
      const v2Response = await fetch("https://services.leadconnectorhq.com/contacts/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Version": "2021-07-28",
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          locationId: locationId,
          email: payload.email,
          firstName: payload.firstName || "",
          lastName: payload.lastName || "",
          tags: ["portal_invited", "portal_user"],
          customFields: [
            {
              key: "invitation_token",
              field_value: payload.invitationToken,
            },
            {
              key: "tenant_name",
              field_value: payload.tenantName,
            },
          ],
        }),
      });

      if (v2Response.ok) {
        const v2Data = await v2Response.json();
        contactId = v2Data.contact?.id || v2Data.id;
        v2Success = true;
        console.log("Contact created in GHL v2:", contactId);
      } else {
        const v2Error = await v2Response.text();
        console.log("GHL v2 failed, trying v1:", v2Error);
      }
    } catch (v2Error) {
      console.log("GHL v2 error, trying v1:", v2Error);
    }

    // If v2 failed, try v1 API
    if (!v2Success) {
      const v1Response = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
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

      if (!v1Response.ok) {
        const errorText = await v1Response.text();
        console.error("GHL API error creating contact (v1):", errorText);
        return NextResponse.json(
          { success: false, error: "Failed to create contact in GHL. Please ensure you're using a valid v2 API token with contacts.write scope." },
          { status: 500 }
        );
      }

      const v1Data = await v1Response.json();
      contactId = v1Data.contact?.id;
      console.log("Contact created in GHL v1:", contactId);
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: "Contact created in GHL successfully",
      contactId: contactId,
      apiVersion: v2Success ? "v2" : "v1",
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
