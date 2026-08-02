// Create Invoice via GHL API
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
    if (!body.contactId || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: contactId, items" },
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

    // Prepare invoice data for GHL
    const invoiceData = {
      contactId: body.contactId,
      locationId: locationId,
      name: body.name || "Invoice",
      description: body.description || "",
      currency: body.currency || "USD",
      items: body.items.map((item: { name: string; description?: string; quantity: number; amount: number }) => ({
        name: item.name,
        description: item.description || "",
        qty: item.quantity || 1,
        price: item.amount,
      })),
      issueDate: body.issueDate || new Date().toISOString().split("T")[0],
      dueDate: body.dueDate,
      sendEmail: body.sendEmail !== false, // Default to true
      sendSms: body.sendSms || false,
    };

    // Call GHL API to create invoice
    const ghlResponse = await fetch("https://rest.gohighlevel.com/v1/invoices", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });

    if (!ghlResponse.ok) {
      const errorData = await ghlResponse.json();
      console.error("GHL API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create invoice in GHL", details: errorData },
        { status: 500 }
      );
    }

    const ghlInvoice = await ghlResponse.json();

    // Store invoice reference in our database
    const { data: paymentRecord, error: insertError } = await supabase
      .from("payment_records")
      .insert({
        contact_id: body.contactId,
        association_id: body.associationId,
        unit_id: body.unitId,
        payment_type: body.paymentType || "invoice",
        amount: body.items.reduce((sum: number, item: { amount: number; quantity?: number }) => 
          sum + (item.amount * (item.quantity || 1)), 0),
        description: body.description,
        processor: "ghl",
        status: "invoiced",
        invoice_number: ghlInvoice.invoiceNumber || ghlInvoice.id,
        ghl_invoice_id: ghlInvoice.id,
        initiated_at: new Date().toISOString(),
        due_date: body.dueDate,
        line_items: body.items,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing payment record:", insertError);
      // Don't fail - GHL invoice was created successfully
    }

    return NextResponse.json({
      success: true,
      data: {
        invoiceId: ghlInvoice.id,
        invoiceNumber: ghlInvoice.invoiceNumber,
        paymentLink: ghlInvoice.paymentLink,
        totalAmount: invoiceData.items.reduce((sum: number, item: { qty: number; price: number }) => 
          sum + (item.qty * item.price), 0),
        status: "invoiced",
        paymentRecordId: paymentRecord?.id,
      },
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
