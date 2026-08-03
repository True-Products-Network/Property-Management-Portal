// Platform Billing Webhook Handler
// POST /api/platform/webhooks/billing - Handle billing events from payment provider

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for billing webhook payload
const billingWebhookSchema = z.object({
  eventType: z.enum([
    "subscription.created",
    "subscription.updated",
    "subscription.cancelled",
    "subscription.past_due",
    "payment.succeeded",
    "payment.failed",
    "invoice.paid",
    "invoice.payment_failed",
    "customer.created",
    "customer.updated",
  ]),
  billingReference: z.string(),
  billingCustomerId: z.string(),
  tenantCode: z.string().optional(),
  tenantId: z.string().uuid().optional(),
  amount: z.number().optional(),
  currency: z.string().default("USD"),
  status: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  eventTimestamp: z.string().optional(),
});

// Log billing event
async function logBillingEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    tenantId: string;
    eventType: string;
    billingReference: string;
    billingCustomerId: string;
    amount?: number;
    currency: string;
    status?: string;
    metadata: any;
    processed?: boolean;
    processingError?: string;
  }
) {
  await supabase.from("billing_events").insert({
    tenant_id: params.tenantId,
    event_type: params.eventType,
    billing_reference: params.billingReference,
    billing_customer_id: params.billingCustomerId,
    amount: params.amount,
    currency: params.currency,
    status: params.status,
    metadata: params.metadata,
    processed: params.processed ?? false,
    processing_error: params.processingError,
    event_timestamp: params.metadata?.eventTimestamp || new Date().toISOString(),
  });
}

// Log audit event
async function logAuditEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    action: string;
    actionCategory: string;
    tenantId?: string;
    targetType?: string;
    targetId?: string;
    newValue?: any;
    reason?: string;
  }
) {
  await supabase.from("platform_audit_events").insert({
    actor_type: "system",
    tenant_id: params.tenantId,
    action: params.action,
    action_category: params.actionCategory,
    target_type: params.targetType,
    target_id: params.targetId,
    new_value: params.newValue,
    reason: params.reason,
  });
}

// POST /api/platform/webhooks/billing
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  let payload: any;

  try {
    // Parse and validate webhook payload
    payload = await request.json();
    const validation = billingWebhookSchema.safeParse(payload);

    if (!validation.success) {
      console.error("Invalid webhook payload:", validation.error);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Find tenant by code or ID
    let tenantId = data.tenantId;
    
    if (!tenantId && data.tenantCode) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("code", data.tenantCode)
        .single();
      
      if (tenant) {
        tenantId = tenant.id;
      }
    }

    // If still no tenant, try to find by billing customer ID
    if (!tenantId) {
      const { data: subscription } = await supabase
        .from("tenant_subscriptions")
        .select("tenant_id")
        .eq("billing_customer_id", data.billingCustomerId)
        .single();
      
      if (subscription) {
        tenantId = subscription.tenant_id;
      }
    }

    if (!tenantId) {
      // Log the event anyway but mark as unprocessed
      await logBillingEvent(supabase, {
        tenantId: "00000000-0000-0000-0000-000000000000", // Unknown tenant placeholder
        eventType: data.eventType,
        billingReference: data.billingReference,
        billingCustomerId: data.billingCustomerId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        metadata: data.metadata,
        processed: false,
        processingError: "Tenant not found",
      });

      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Process based on event type
    let processed = false;
    let processingError: string | undefined;

    try {
      switch (data.eventType) {
        case "subscription.created":
        case "subscription.updated": {
          // Update subscription status and billing info
          const { error } = await supabase
            .from("tenant_subscriptions")
            .upsert({
              tenant_id: tenantId,
              billing_reference: data.billingReference,
              billing_customer_id: data.billingCustomerId,
              status: data.status === "active" ? "active" : 
                      data.status === "past_due" ? "past_due" :
                      data.status === "cancelled" ? "cancelled" : "active",
            }, {
              onConflict: "tenant_id",
            });

          if (error) throw error;

          // Update tenant status if needed
          if (data.status === "past_due") {
            await supabase
              .from("tenants")
              .update({ status: "past_due" })
              .eq("id", tenantId);
          } else if (data.status === "active") {
            await supabase
              .from("tenants")
              .update({ status: "active" })
              .eq("id", tenantId);
          }

          processed = true;
          break;
        }

        case "subscription.cancelled": {
          // Update subscription status
          const { error } = await supabase
            .from("tenant_subscriptions")
            .update({
              status: "cancelled",
              cancellation_date: new Date().toISOString().split("T")[0],
            })
            .eq("tenant_id", tenantId);

          if (error) throw error;

          // Update tenant status
          await supabase
            .from("tenants")
            .update({ status: "cancelled" })
            .eq("id", tenantId);

          processed = true;
          break;
        }

        case "subscription.past_due": {
          // Update subscription status
          const { error } = await supabase
            .from("tenant_subscriptions")
            .update({ status: "past_due" })
            .eq("tenant_id", tenantId);

          if (error) throw error;

          // Update tenant status
          await supabase
            .from("tenants")
            .update({ status: "past_due" })
            .eq("id", tenantId);

          processed = true;
          break;
        }

        case "payment.succeeded":
        case "invoice.paid": {
          // Payment succeeded - could trigger receipt email, etc.
          processed = true;
          break;
        }

        case "payment.failed":
        case "invoice.payment_failed": {
          // Payment failed - could trigger notification
          processed = true;
          break;
        }

        case "customer.created":
        case "customer.updated": {
          // Update billing customer ID if needed
          const { error } = await supabase
            .from("tenant_subscriptions")
            .upsert({
              tenant_id: tenantId,
              billing_customer_id: data.billingCustomerId,
            }, {
              onConflict: "tenant_id",
            });

          if (error) throw error;
          processed = true;
          break;
        }

        default:
          processingError = `Unhandled event type: ${data.eventType}`;
      }

      // Log audit event for subscription changes
      if (data.eventType.startsWith("subscription.")) {
        await logAuditEvent(supabase, {
          action: data.eventType,
          actionCategory: "tenant",
          tenantId,
          targetType: "subscription",
          targetId: data.billingReference,
          newValue: {
            status: data.status,
            amount: data.amount,
            currency: data.currency,
          },
          reason: `Billing webhook: ${data.eventType}`,
        });
      }

    } catch (processError) {
      processingError = processError instanceof Error ? processError.message : "Processing failed";
      console.error("Error processing billing webhook:", processError);
    }

    // Log the billing event
    await logBillingEvent(supabase, {
      tenantId,
      eventType: data.eventType,
      billingReference: data.billingReference,
      billingCustomerId: data.billingCustomerId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      metadata: data.metadata,
      processed,
      processingError,
    });

    if (!processed) {
      return NextResponse.json(
        { success: false, error: processingError || "Processing failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${data.eventType} for tenant ${tenantId}`,
    });

  } catch (error) {
    console.error("Error in POST /api/platform/webhooks/billing:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
