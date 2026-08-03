// Platform Plans API Routes
// GET /api/platform/plans - List all plans
// POST /api/platform/plans - Create new plan

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for creating plan
const createPlanSchema = z.object({
  code: z.string().min(1, "Code is required").regex(/^[a-z0-9-]+$/, "Code must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  displayOrder: z.number().default(0),
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

// GET /api/platform/plans
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
    const includeInactive = searchParams.get("includeInactive") === "true";
    const includeFeatures = searchParams.get("includeFeatures") === "true";

    // Build query
    let query = supabase
      .from("plans")
      .select(includeFeatures ? "*, plan_features(*, features(*))" : "*")
      .order("display_order", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching plans:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in GET /api/platform/plans:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/platform/plans
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
    const validation = createPlanSchema.safeParse(body);

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

    // Create plan
    const { data, error } = await supabase
      .from("plans")
      .insert({
        code: validation.data.code,
        name: validation.data.name,
        description: validation.data.description,
        is_active: validation.data.isActive,
        is_public: validation.data.isPublic,
        display_order: validation.data.displayOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating plan:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await logAuditEvent(supabase, {
      action: "plan_created",
      actionCategory: "plan",
      targetType: "plan",
      targetId: data.id,
      newValue: data,
    });

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/platform/plans:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
