// Platform Features API Routes
// GET /api/platform/features - List all features

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Check if user has platform support access
async function isPlatformSupport(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_support");
  return !!data && !error;
}

// GET /api/platform/features
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
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Build query
    let query = supabase
      .from("features")
      .select("*")
      .order("category", { ascending: true })
      .order("display_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching features:", error);
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
    console.error("Error in GET /api/platform/features:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
