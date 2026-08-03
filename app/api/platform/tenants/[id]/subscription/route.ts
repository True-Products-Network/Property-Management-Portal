// Platform Tenant Subscription API Routes
// GET /api/platform/tenants/[id]/subscription - Get tenant subscription
// PATCH /api/platform/tenants/[id]/subscription - Update tenant subscription

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for updating subscription
const updateSubscriptionSchema = z.object({
  planId: z.string().uuid().optional(),
  status: z.enum(["active", "trialing", "past_due", "cancelled", "suspended"]).optional(),
  billingReference: z.string().optional(),
  billingCustomerId: z.string().optional(),
  effectiveDate: z.string().optional(),
  cancellationDate: z.string().optional(),
  trialEndsAt: z.string().optional(),
  gracePeriodEndsAt: z.string().optional(),
});

// Check if user has platform support access
async function isPlatformSupport(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_support");
  return !!data && !error;
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
    previousValue?: any;
    newValue?: any;
    reason?: string;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from("platform_audit_events").insert({
    actor_id: user?.id,
    actor_type: user ? "platform_support" : "system",
    tenant_id: params.tenantId,
    action: params.action,
    action_category: params.actionCategory,
    target_type: params.targetType,
    target_id: params.targetId,
    previous_value: params.previousValue,
    new_value: params.newValue,
    reason: params.reason,
  });
}

// POST /api/platform/tenants/[id]/subscription - Create new subscription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check platform support access
    if (!await isPlatformSupport(supabase)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Platform access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Parse and validate body
    const body = await request.json();
    const validation = updateSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (!validation.data.planId) {
      return NextResponse.json(
        { success: false, error: "planId is required" },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from("tenant_subscriptions")
      .select("id")
      .eq("tenant_id", id)
      .maybeSingle();

    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: "Subscription already exists for this tenant" },
        { status: 409 }
      );
    }

    // Create new subscription
    const { data, error } = await supabase
      .from("tenant_subscriptions")
      .insert({
        tenant_id: id,
        plan_id: validation.data.planId,
        status: validation.data.status || "active",
        billing_reference: validation.data.billingReference,
        billing_customer_id: validation.data.billingCustomerId,
        effective_date: validation.data.effectiveDate || new Date().toISOString().split("T")[0],
        cancellation_date: validation.data.cancellationDate,
        trial_ends_at: validation.data.trialEndsAt,
        grace_period_ends_at: validation.data.gracePeriodEndsAt,
      })
      .select("*, plans(*)")
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await logAuditEvent(supabase, {
      action: "subscription_created",
      actionCategory: "tenant",
      tenantId: id,
      targetType: "subscription",
      targetId: data.id,
      newValue: data,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/platform/tenants/[id]/subscription:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/platform/tenants/[id]/subscription - Alias for PATCH
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Forward to PATCH handler
  return PATCH(request, { params });
}

// GET /api/platform/tenants/[id]/subscription
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check platform support access
    if (!await isPlatformSupport(supabase)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Platform access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get subscription with plan details
    const { data: subscription, error } = await supabase
      .from("tenant_subscriptions")
      .select("*, plans(*)")
      .eq("tenant_id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get entitlements
    const { data: entitlements } = await supabase
      .from("tenant_entitlements")
      .select("*, features(*)")
      .eq("tenant_id", id);

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        entitlements: entitlements || [],
      },
    });
  } catch (error) {
    console.error("Error in GET /api/platform/tenants/[id]/subscription:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/platform/tenants/[id]/subscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check platform support access
    if (!await isPlatformSupport(supabase)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Platform access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Parse and validate body
    const body = await request.json();
    const validation = updateSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Get existing subscription for audit
    const { data: existingSubscription, error: fetchError } = await supabase
      .from("tenant_subscriptions")
      .select("*")
      .eq("tenant_id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    let data;
    let error;

    if (existingSubscription) {
      // Update existing subscription
      const result = await supabase
        .from("tenant_subscriptions")
        .update({
          ...(validation.data.planId && { plan_id: validation.data.planId }),
          ...(validation.data.status && { status: validation.data.status }),
          ...(validation.data.billingReference !== undefined && { billing_reference: validation.data.billingReference }),
          ...(validation.data.billingCustomerId !== undefined && { billing_customer_id: validation.data.billingCustomerId }),
          ...(validation.data.effectiveDate && { effective_date: validation.data.effectiveDate }),
          ...(validation.data.cancellationDate !== undefined && { cancellation_date: validation.data.cancellationDate }),
          ...(validation.data.trialEndsAt !== undefined && { trial_ends_at: validation.data.trialEndsAt }),
          ...(validation.data.gracePeriodEndsAt !== undefined && { grace_period_ends_at: validation.data.gracePeriodEndsAt }),
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", id)
        .select("*, plans(*)")
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Create new subscription
      if (!validation.data.planId) {
        return NextResponse.json(
          { success: false, error: "planId is required for new subscription" },
          { status: 400 }
        );
      }

      const result = await supabase
        .from("tenant_subscriptions")
        .insert({
          tenant_id: id,
          plan_id: validation.data.planId,
          status: validation.data.status || "active",
          billing_reference: validation.data.billingReference,
          billing_customer_id: validation.data.billingCustomerId,
          effective_date: validation.data.effectiveDate || new Date().toISOString().split("T")[0],
          cancellation_date: validation.data.cancellationDate,
          trial_ends_at: validation.data.trialEndsAt,
          grace_period_ends_at: validation.data.gracePeriodEndsAt,
        })
        .select("*, plans(*)")
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error updating subscription:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await logAuditEvent(supabase, {
      action: existingSubscription ? "subscription_updated" : "subscription_created",
      actionCategory: "tenant",
      tenantId: id,
      targetType: "subscription",
      targetId: data.id,
      previousValue: existingSubscription,
      newValue: data,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in PATCH /api/platform/tenants/[id]/subscription:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
