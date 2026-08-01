// Webhook Handler: GHL Invoice Events
// Handles invoice status updates, payments, and reminders from GHL

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateGhlInvoiceDetails, markAccountingSynced } from "@/lib/api/payments";

// GHL Invoice Event Types
interface GhlInvoiceEvent {
  eventId: string;
  eventType: 'invoice.created' | 'invoice.sent' | 'invoice.viewed' | 'invoice.paid' | 'invoice.overdue' | 'invoice.cancelled' | 'payment_link.created' | 'payment_link.paid' | 'payment_link.expired';
  invoiceId?: string;
  paymentLinkId?: string;
  paymentRecordId?: string;
  payload: {
    invoice?: {
      id: string;
      number: string;
      status: string;
      amount: number;
      contactId: string;
      sentAt?: string;
      viewedAt?: string;
      paidAt?: string;
      transactionId?: string;
    };
    paymentLink?: {
      id: string;
      url: string;
      status: string;
      amount: number;
      contactId: string;
      paidAt?: string;
      transactionId?: string;
    };
    payment?: {
      transactionId: string;
      amount: number;
      status: string;
      paidAt: string;
    };
  };
}

// Verify GHL webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // In production, implement proper HMAC verification
  // For now, we check if the secret matches
  return signature === secret || process.env.GHL_WEBHOOK_SECRET === signature;
}

// Store webhook event for processing
async function storeWebhookEvent(event: GhlInvoiceEvent): Promise<void> {
  const supabase = await createClient();
  
  await supabase.from("ghl_invoice_events").insert({
    event_id: event.eventId,
    event_type: event.eventType,
    ghl_invoice_id: event.invoiceId,
    ghl_payment_link_id: event.paymentLinkId,
    payment_record_id: event.paymentRecordId,
    payload: event.payload,
    processed: false,
  });
}

// Process the webhook event
async function processWebhookEvent(event: GhlInvoiceEvent): Promise<void> {
  const supabase = await createClient();
  
  // Find the payment record by GHL invoice ID or payment link ID
  let paymentRecord = null;
  
  if (event.invoiceId) {
    const { data } = await supabase
      .from("payment_records")
      .select("id")
      .eq("ghl_invoice_id", event.invoiceId)
      .single();
    paymentRecord = data;
  }
  
  if (!paymentRecord && event.paymentLinkId) {
    const { data } = await supabase
      .from("payment_records")
      .select("id")
      .eq("ghl_payment_link_id", event.paymentLinkId)
      .single();
    paymentRecord = data;
  }
  
  if (!paymentRecord) {
    console.warn(`[GHL Webhook] No payment record found for invoice ${event.invoiceId} or link ${event.paymentLinkId}`);
    return;
  }
  
  const paymentRecordId = paymentRecord.id;
  
  // Handle different event types
  switch (event.eventType) {
    case 'invoice.sent':
      await updateGhlInvoiceDetails(paymentRecordId, {
        ghlInvoiceStatus: 'sent',
        sentAt: event.payload.invoice?.sentAt || new Date().toISOString(),
      });
      break;
      
    case 'invoice.viewed':
      await updateGhlInvoiceDetails(paymentRecordId, {
        ghlInvoiceStatus: 'viewed',
        viewedAt: event.payload.invoice?.viewedAt || new Date().toISOString(),
      });
      break;
      
    case 'invoice.paid':
    case 'payment_link.paid':
      await updateGhlInvoiceDetails(paymentRecordId, {
        ghlInvoiceStatus: 'paid',
        status: 'completed',
        completedAt: event.payload.payment?.paidAt || event.payload.invoice?.paidAt || new Date().toISOString(),
        processorTransactionId: event.payload.payment?.transactionId || event.payload.invoice?.transactionId,
      });
      
      // Trigger accounting sync if enabled
      await triggerAccountingSync(paymentRecordId, event);
      break;
      
    case 'invoice.overdue':
      await updateGhlInvoiceDetails(paymentRecordId, {
        ghlInvoiceStatus: 'overdue',
      });
      break;
      
    case 'invoice.cancelled':
      await updateGhlInvoiceDetails(paymentRecordId, {
        ghlInvoiceStatus: 'cancelled',
        status: 'cancelled',
      });
      break;
      
    case 'payment_link.expired':
      await updateGhlInvoiceDetails(paymentRecordId, {
        ghlInvoiceStatus: 'expired',
        status: 'expired',
      });
      break;
      
    default:
      console.log(`[GHL Webhook] Unhandled event type: ${event.eventType}`);
  }
}

// Trigger accounting sync webhook
async function triggerAccountingSync(paymentRecordId: string, event: GhlInvoiceEvent): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Check if accounting handoff is enabled
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "accounting_handoff_enabled")
      .single();
    
    if (!setting || setting.value !== 'true') {
      console.log('[Accounting Sync] Accounting handoff is disabled');
      return;
    }
    
    // Get the webhook URL
    const { data: webhookSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "accounting_handoff_webhook_url")
      .single();
    
    if (!webhookSetting?.value) {
      console.warn('[Accounting Sync] No webhook URL configured');
      await markAccountingSynced(paymentRecordId, false, 'No webhook URL configured');
      return;
    }
    
    // Get payment record details
    const { data: payment } = await supabase
      .from("payment_records")
      .select(`
        *,
        associations:association_id (name),
        contacts:contact_id (first_name, last_name, email)
      `)
      .eq("id", paymentRecordId)
      .single();
    
    if (!payment) {
      await markAccountingSynced(paymentRecordId, false, 'Payment record not found');
      return;
    }
    
    // Send webhook to accounting system
    const response = await fetch(webhookSetting.value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'property-management-portal',
      },
      body: JSON.stringify({
        event: 'payment.completed',
        payment: {
          id: payment.id,
          paymentId: payment.payment_id,
          amount: payment.amount,
          processor: payment.processor,
          processorTransactionId: payment.processor_transaction_id,
          invoiceNumber: payment.invoice_number,
          ghlInvoiceId: payment.ghl_invoice_id,
          ghlInvoiceNumber: payment.ghl_invoice_number,
          paymentMode: payment.payment_mode,
          completedAt: payment.completed_at,
          lineItems: payment.line_items,
        },
        association: payment.associations,
        contact: payment.contacts,
        ghlEvent: event,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (response.ok) {
      await markAccountingSynced(paymentRecordId, true);
      console.log(`[Accounting Sync] Successfully synced payment ${paymentRecordId}`);
    } else {
      const errorText = await response.text();
      await markAccountingSynced(paymentRecordId, false, `HTTP ${response.status}: ${errorText}`);
      console.error(`[Accounting Sync] Failed to sync payment ${paymentRecordId}: ${errorText}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await markAccountingSynced(paymentRecordId, false, errorMessage);
    console.error('[Accounting Sync] Error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the signature from headers
    const signature = request.headers.get('x-ghl-signature') || 
                      request.headers.get('X-GHL-Signature') ||
                      request.headers.get('x-webhook-signature');
    
    const body = await request.json();
    
    // Verify webhook signature if configured
    const webhookSecret = process.env.GHL_INVOICE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(JSON.stringify(body), signature, webhookSecret);
      if (!isValid) {
        console.error('[GHL Webhook] Invalid signature');
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }
    
    // Parse and validate the event
    const event: GhlInvoiceEvent = {
      eventId: body.eventId || body.id || `evt_${Date.now()}`,
      eventType: body.type || body.eventType,
      invoiceId: body.invoiceId || body.invoice?.id,
      paymentLinkId: body.paymentLinkId || body.paymentLink?.id,
      paymentRecordId: body.paymentRecordId,
      payload: body,
    };
    
    if (!event.eventType) {
      return NextResponse.json(
        { success: false, error: 'Missing event type' },
        { status: 400 }
      );
    }
    
    // Store the event first
    await storeWebhookEvent(event);
    
    // Process the event
    await processWebhookEvent(event);
    
    // Mark event as processed
    const supabase = await createClient();
    await supabase
      .from("ghl_invoice_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("event_id", event.eventId);
    
    return NextResponse.json({ success: true, message: 'Event processed' });
  } catch (error) {
    console.error('[GHL Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET for webhook verification (some systems verify with GET first)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'GHL Invoice Webhook endpoint active',
    endpoints: {
      POST: '/api/webhooks/ghl/invoices - Receive invoice events',
    }
  });
}
