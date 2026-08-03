// Platform Tenant Detail API Routes
// GET /api/platform/tenants/[id] - Get single tenant
// PATCH /api/platform/tenants/[id] - Update tenant
// DELETE /api/platform/tenants/[id] - Delete tenant

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for updating tenant
const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["active", "trialing", "past_due", "suspended", "cancelled"]).optional(),
  primaryEmail: z.string().email().optional(),
  primaryPhone: z.string().optional(),
  billingEmail: z.string().email().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  branding: z.record(z.string(), z.any()).optional(),
  settings: z.record(z.string(), z.any()).optional(),
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

// PUT /api/platform/tenants/[id] - Alias for PATCH
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Forward to PATCH handler
  return PATCH(request, { params });
}

// GET /api/platform/tenants/[id]
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

    // Get tenant with subscription info
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();

    if (tenantError) {
      if (tenantError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Tenant not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: tenantError.message },
        { status: 500 }
      );
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from("tenant_subscriptions")
      .select("*, plans(*)")
      .eq("tenant_id", id)
      .maybeSingle();

    // Get user count
    const { count: userCount } = await supabase
      .from("tenant_users")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", id);

    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        subscription,
        stats: {
          userCount: userCount || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error in GET /api/platform/tenants/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/platform/tenants/[id]
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

    // Get existing tenant for audit
    const { data: existingTenant, error: fetchError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Tenant not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = updateTenantSchema.safeParse(body);

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

    const { data: { user } } = await supabase.auth.getUser();

    // Update tenant
    const { data, error } = await supabase
      .from("tenants")
      .update({
        ...(validation.data.name && { name: validation.data.name }),
        ...(validation.data.status && { status: validation.data.status }),
        ...(validation.data.primaryEmail !== undefined && { primary_email: validation.data.primaryEmail }),
        ...(validation.data.primaryPhone !== undefined && { primary_phone: validation.data.primaryPhone }),
        ...(validation.data.billingEmail !== undefined && { billing_email: validation.data.billingEmail }),
        ...(validation.data.timezone && { timezone: validation.data.timezone }),
        ...(validation.data.locale && { locale: validation.data.locale }),
        ...(validation.data.branding && { branding: validation.data.branding }),
        ...(validation.data.settings && { settings: validation.data.settings }),
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating tenant:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await logAuditEvent(supabase, {
      action: "tenant_updated",
      actionCategory: "tenant",
      tenantId: id,
      targetType: "tenant",
      targetId: id,
      previousValue: existingTenant,
      newValue: data,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in PATCH /api/platform/tenants/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/platform/tenants/[id]
export async function DELETE(
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

    // Get existing tenant for audit
    const { data: existingTenant, error: fetchError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Tenant not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // Delete tenant (cascade will handle related records)
    const { error } = await supabase
      .from("tenants")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting tenant:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await logAuditEvent(supabase, {
      action: "tenant_deleted",
      actionCategory: "tenant",
      targetType: "tenant",
      targetId: id,
      previousValue: existingTenant,
    });

    return NextResponse.json({
      success: true,
      message: "Tenant deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/platform/tenants/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
