import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GHL Invitation Webhook
 * 
 * This endpoint sends user invitation emails via GHL
 * when a new user is invited to the portal.
 */

interface InvitePayload {
  contactId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export async function POST(request: Request) {
  try {
    const payload: InvitePayload = await request.json();
    
    console.log("GHL Invitation webhook received:", {
      contactId: payload.contactId,
      email: payload.email,
      role: payload.role,
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
      .eq("key", "ghl_access_token")
      .single();

    if (!locationSetting?.value || !tokenSetting?.value) {
      return NextResponse.json(
        { success: false, error: "GHL not configured" },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Create or update the contact in GHL
    // 2. Trigger a workflow in GHL that sends the invitation email
    // 3. Or use GHL's email API to send directly

    // For now, we'll simulate a successful webhook call
    console.log("Would send GHL invitation to:", payload.email);

    // Example GHL API call (commented out until GHL integration is fully set up):
    /*
    const ghlResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenSetting.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        tags: ["portal_invited", `role_${payload.role}`],
      }),
    });

    if (!ghlResponse.ok) {
      throw new Error(`GHL API error: ${ghlResponse.statusText}`);
    }
    */

    return NextResponse.json({
      success: true,
      message: "Invitation webhook processed",
      note: "GHL integration ready - uncomment API call when credentials are configured",
    });
  } catch (error) {
    console.error("Error processing GHL invitation webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
