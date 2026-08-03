// Platform Audit API Routes
// GET /api/platform/audit - List audit events with filters

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Check if user has platform support access
async function isPlatformSupport(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_support");
  return !!data && !error;
}

// GET /api/platform/audit
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
    const actionCategory = searchParams.get("actionCategory");
    const action = searchParams.get("action");
    const actorType = searchParams.get("actorType");
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Build query
    let query = supabase
      .from("platform_audit_events")
      .select("*", { count: "exact" });

    // Apply filters
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    if (actionCategory) {
      query = query.eq("action_category", actionCategory);
    }

    if (action) {
      query = query.eq("action", action);
    }

    if (actorType) {
      query = query.eq("actor_type", actorType);
    }

    if (targetType) {
      query = query.eq("target_type", targetType);
    }

    if (targetId) {
      query = query.eq("target_id", targetId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      // Add one day to include the end date fully
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      query = query.lt("created_at", endDateObj.toISOString());
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching audit events:", error);
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
    console.error("Error in GET /api/platform/audit:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
