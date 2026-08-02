// Create Payment Link via GHL API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin or management role
    const userRoles = user.user_metadata?.roles || [];
    const isAdmin = userRoles.includes("ADMIN_USER");
    const isManagement = userRoles.includes("MANAGEMENT_STAFF");
    
    if (!isAdmin && !isManagement) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.contactId || !body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: "Missing required fields: contactId, amount" },
        { status: 400 }
      );
    }

    // Get GHL API credentials from settings
    const { data: ghlSettings } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ghl_access_token")
      .single();

    if (!ghlSettings?.value) {
      return NextResponse.json(
        { error: "GHL not configured" },
        { status: 400 }
      );
    }

    const accessToken = ghlSettings.value;

    // Get location ID
    const { data: locationData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ghl_location_id")
      .single();

    const locationId = locationData?.value;

    // Prepare payment link data for GHL
    const paymentLinkData = {
      contactId: body.contactId,
      locationId: locationId,
      name: body.name || "Payment",
      description: body.description || "",
      amount: body.amount,
      currency: body.currency || "USD",
      sendEmail: body.sendEmail !== false,
      sendSms: body.sendSms || false,
      redirectUrl: body.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    };

    // Call GHL API to create payment link
    const ghlResponse = await fetch("https://rest.gohighlevel.com/v1/payments/links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentLinkData),
    });

    if (!ghlResponse.ok) {
      const errorData = await ghlResponse.json();
      console.error("GHL API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create payment link in GHL", details: errorData },
        { status: 500 }
      );
    }

    const ghlPaymentLink = await ghlResponse.json();

    // Store payment link reference in our database
    const { data: paymentRecord, error: insertError } = await supabase
      .from("payment_records")
      .insert({
        contact_id: body.contactId,
        association_id: body.associationId,
        unit_id: body.unitId,
        payment_type: body.paymentType || "payment_link",
        amount: body.amount,
        description: body.description,
        processor: "ghl",
        status: "pending",
        ghl_payment_link_id: ghlPaymentLink.id,
        ghl_payment_link_url: ghlPaymentLink.url,
        initiated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing payment record:", insertError);
    }

    return NextResponse.json({
      success: true,
      data: {
        linkId: ghlPaymentLink.id,
        url: ghlPaymentLink.url,
        amount: body.amount,
        status: "pending",
        paymentRecordId: paymentRecord?.id,
      },
    });
  } catch (error) {
    console.error("Error creating payment link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
