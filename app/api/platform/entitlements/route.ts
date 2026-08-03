// Platform Entitlements API Routes
// GET /api/platform/entitlements - List entitlements with filters
// POST /api/platform/entitlements - Create entitlement

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for creating entitlement
const createEntitlementSchema = z.object({
  tenantId: z.string().uuid("Tenant ID is required"),
  featureId: z.string().uuid("Feature ID is required"),
  entitlementType: z.enum(["addon", "override", "trial"]),
  isEnabled: z.boolean().default(true),
  limitValue: z.number().optional(),
  effectiveDate: z.string().default(() => new Date().toISOString().split("T")[0]),
  expirationDate: z.string().optional(),
  reason: z.string().optional(),
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

// GET /api/platform/entitlements
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check platform support access
    if (!await isPlatformSupport(supabase)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Platform access required" },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const featureId = searchParams.get("featureId");
    const entitlementType = searchParams.get("entitlementType");
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // Build query
    let query = supabase
      .from("tenant_entitlements")
      .select("*, features(*), tenants(id, name, code)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    if (featureId) {
      query = query.eq("feature_id", featureId);
    }

    if (entitlementType) {
      query = query.eq("entitlement_type", entitlementType);
    }

    if (activeOnly) {
      const today = new Date().toISOString().split("T")[0];
      query = query
        .lte("effective_date", today)
        .or(`expiration_date.is.null,expiration_date.gte.${today}`);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching entitlements:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/platform/entitlements:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/platform/entitlements
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check platform support access
    if (!await isPlatformSupport(supabase)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Platform access required" },
        { status: 403 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = createEntitlementSchema.safeParse(body);

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

    // Create entitlement
    const { data, error } = await supabase
      .from("tenant_entitlements")
      .insert({
        tenant_id: validation.data.tenantId,
        feature_id: validation.data.featureId,
        entitlement_type: validation.data.entitlementType,
        is_enabled: validation.data.isEnabled,
        limit_value: validation.data.limitValue,
        effective_date: validation.data.effectiveDate,
        expiration_date: validation.data.expirationDate,
        reason: validation.data.reason,
        granted_by: user?.id,
      })
      .select("*, features(*), tenants(id, name, code)")
      .single();

    if (error) {
      console.error("Error creating entitlement:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await logAuditEvent(supabase, {
      action: "entitlement_created",
      actionCategory: "entitlement",
      tenantId: validation.data.tenantId,
      targetType: "entitlement",
      targetId: data.id,
      newValue: data,
      reason: validation.data.reason,
    });

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/platform/entitlements:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
