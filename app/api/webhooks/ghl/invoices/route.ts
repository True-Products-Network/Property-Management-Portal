// GHL Invoice Webhook Handler
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// Verify GHL webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-ghl-signature") || "";

    // Get webhook secret from settings
    const supabase = await createClient();
    const { data: secretData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ghl_webhook_secret")
      .single();

    // Verify signature if secret is configured
    if (secretData?.value) {
      if (!verifyWebhookSignature(payload, signature, secretData.value)) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(payload);
    const eventType = event.type;
    const invoiceData = event.data;

    console.log(`Received GHL invoice webhook: ${eventType}`, invoiceData);

    // Handle different invoice events
    switch (eventType) {
      case "invoice.paid":
        await handleInvoicePaid(invoiceData, supabase);
        break;

      case "invoice.overdue":
        await handleInvoiceOverdue(invoiceData, supabase);
        break;

      case "invoice.cancelled":
        await handleInvoiceCancelled(invoiceData, supabase);
        break;

      case "invoice.refunded":
        await handleInvoiceRefunded(invoiceData, supabase);
        break;

      default:
        console.log(`Unhandled invoice event type: ${eventType}`);
    }

    // Always return 200 to prevent GHL from retrying
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing invoice webhook:", error);
    // Return 200 to prevent GHL from retrying, but log the error
    return NextResponse.json({ success: true });
  }
}

async function handleInvoicePaid(invoiceData: any, supabase: any) {
  // Update payment record status
  const { error } = await supabase
    .from("payment_records")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      processor_transaction_id: invoiceData.transactionId,
      metadata: {
        ghl_invoice_id: invoiceData.id,
        payment_method: invoiceData.paymentMethod,
        paid_at: invoiceData.paidAt,
      },
    })
    .eq("ghl_invoice_id", invoiceData.id);

  if (error) {
    console.error("Error updating payment record:", error);
  }

  // Trigger GHL workflow for payment confirmation
  await triggerGhlWorkflow(invoiceData.contactId, "payment_received", {
    invoice_id: invoiceData.id,
    amount: invoiceData.amount,
    payment_method: invoiceData.paymentMethod,
  }, supabase);
}

async function handleInvoiceOverdue(invoiceData: any, supabase: any) {
  const { error } = await supabase
    .from("payment_records")
    .update({
      status: "overdue",
      metadata: {
        ghl_invoice_id: invoiceData.id,
        overdue_at: new Date().toISOString(),
      },
    })
    .eq("ghl_invoice_id", invoiceData.id);

  if (error) {
    console.error("Error updating payment record:", error);
  }

  // Trigger GHL workflow for overdue reminder
  await triggerGhlWorkflow(invoiceData.contactId, "payment_overdue", {
    invoice_id: invoiceData.id,
    amount: invoiceData.amount,
    due_date: invoiceData.dueDate,
  }, supabase);
}

async function handleInvoiceCancelled(invoiceData: any, supabase: any) {
  const { error } = await supabase
    .from("payment_records")
    .update({
      status: "cancelled",
      metadata: {
        ghl_invoice_id: invoiceData.id,
        cancelled_at: new Date().toISOString(),
      },
    })
    .eq("ghl_invoice_id", invoiceData.id);

  if (error) {
    console.error("Error updating payment record:", error);
  }
}

async function handleInvoiceRefunded(invoiceData: any, supabase: any) {
  const { error } = await supabase
    .from("payment_records")
    .update({
      status: "refunded",
      metadata: {
        ghl_invoice_id: invoiceData.id,
        refunded_at: new Date().toISOString(),
        refund_amount: invoiceData.refundAmount,
      },
    })
    .eq("ghl_invoice_id", invoiceData.id);

  if (error) {
    console.error("Error updating payment record:", error);
  }
}

async function triggerGhlWorkflow(contactId: string, workflowTrigger: string, data: any, supabase: any) {
  try {
    // Get GHL API credentials
    const { data: tokenData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ghl_access_token")
      .single();

    if (!tokenData?.value) {
      console.error("GHL not configured for workflow trigger");
      return;
    }

    // Call GHL to trigger workflow
    const response = await fetch("https://rest.gohighlevel.com/v1/workflows/trigger", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contactId: contactId,
        event: workflowTrigger,
        data: data,
      }),
    });

    if (!response.ok) {
      console.error("Failed to trigger GHL workflow:", await response.text());
    }
  } catch (error) {
    console.error("Error triggering GHL workflow:", error);
  }
}
