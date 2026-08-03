// Platform Tenants API Routes
// GET /api/platform/tenants - List tenants with filters
// POST /api/platform/tenants - Create tenant

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for creating tenant
const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").regex(/^[a-z0-9-]+$/, "Code must be lowercase alphanumeric with hyphens"),
  status: z.enum(["active", "trialing", "past_due", "suspended", "cancelled"]).default("active"),
  primaryEmail: z.string().email().optional(),
  primaryPhone: z.string().optional(),
  billingEmail: z.string().email().optional(),
  timezone: z.string().default("America/Chicago"),
  locale: z.string().default("en-US"),
  branding: z.record(z.string(), z.any()).default({}),
  settings: z.record(z.string(), z.any()).default({}),
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
    action: params.action,
    action_category: params.actionCategory,
    target_type: params.targetType,
    target_id: params.targetId,
    previous_value: params.previousValue,
    new_value: params.newValue,
    reason: params.reason,
  });
}

// GET /api/platform/tenants
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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Build query
    let query = supabase.from("tenants").select("*", { count: "exact" });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,primary_email.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching tenants:", error);
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
    console.error("Error in GET /api/platform/tenants:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/platform/tenants
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
    const validation = createTenantSchema.safeParse(body);

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

    // Create tenant
    const { data, error } = await supabase
      .from("tenants")
      .insert({
        name: validation.data.name,
        code: validation.data.code,
        status: validation.data.status,
        primary_email: validation.data.primaryEmail,
        primary_phone: validation.data.primaryPhone,
        billing_email: validation.data.billingEmail,
        timezone: validation.data.timezone,
        locale: validation.data.locale,
        branding: validation.data.branding,
        settings: validation.data.settings,
        created_by: user?.id,
        updated_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tenant:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await logAuditEvent(supabase, {
      action: "tenant_created",
      actionCategory: "tenant",
      targetType: "tenant",
      targetId: data.id,
      newValue: data,
    });

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/platform/tenants:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
