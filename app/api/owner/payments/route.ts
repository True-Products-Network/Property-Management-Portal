// Owner Payments API
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
      .select("id")
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json({ 
        success: true, 
        data: { payments: [], outstandingBalance: 0 }
      });
    }

    const contactId = contactData.id;

    // Get property IDs for this contact to fetch property names
    const { data: contactRoles } = await supabase
      .from("contact_roles")
      .select("property_id, unit_id")
      .eq("contact_id", contactId)
      .eq("is_active", true);

    const propertyIds = [...new Set((contactRoles || []).map(r => r.property_id).filter(Boolean))];
    const unitIds = [...new Set((contactRoles || []).map(r => r.unit_id).filter(Boolean))];

    // Fetch property names
    const { data: properties } = propertyIds.length > 0
      ? await supabase
          .from("properties")
          .select("id, name")
          .in("id", propertyIds)
      : { data: [] };

    const propertyMap = new Map((properties || []).map(p => [p.id, p.name]));

    // Fetch unit numbers
    const { data: units } = unitIds.length > 0
      ? await supabase
          .from("units")
          .select("id, unit_number")
          .in("id", unitIds)
      : { data: [] };

    const unitMap = new Map((units || []).map(u => [u.id, u.unit_number]));

    // Fetch payments for this contact
    const { data: payments, error } = await supabase
      .from("payment_records")
      .select(`
        id, payment_id, association_id, contact_id, unit_id,
        payment_type, payment_mode, amount, processor, processor_transaction_id,
        status, initiated_at, completed_at, invoice_number, due_date,
        ghl_invoice_id, ghl_payment_link_id, ghl_payment_link_url,
        line_items, maintenance_request_id, approval_id
      `)
      .eq("contact_id", contactId)
      .order("initiated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Calculate outstanding balance
    const outstandingBalance = (payments || [])
      .filter(p => p.status === "pending" || p.status === "invoiced")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        payments: (payments || []).map(p => ({
          id: p.id,
          paymentId: p.payment_id,
          amount: p.amount,
          status: p.status,
          paymentType: p.payment_type,
          paymentMode: p.payment_mode,
          processor: p.processor,
          invoiceNumber: p.invoice_number,
          ghlPaymentLinkUrl: p.ghl_payment_link_url,
          ghlInvoiceId: p.ghl_invoice_id,
          dueDate: p.due_date,
          initiatedAt: p.initiated_at,
          completedAt: p.completed_at,
          propertyName: propertyMap.get(p.association_id), // Using association_id as property reference
          unitNumber: unitMap.get(p.unit_id),
          lineItems: p.line_items,
        })),
        outstandingBalance,
      },
    });
  } catch (error) {
    console.error("Error loading owner payments:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
