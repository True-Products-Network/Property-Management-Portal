// API route to fetch tenant branding
// GET /api/branding?tenantId=xxx

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get branding for tenant
    const { data: branding, error } = await supabase
      .from("tenant_branding")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      console.error("Error fetching branding:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch branding" },
        { status: 500 }
      );
    }

    // If no branding found, return default
    if (!branding) {
      return NextResponse.json({
        success: true,
        branding: {
          brand_name: "Associos Property Management",
          brand_name_line2: "",
          brand_logo_url: null,
          brand_logo_svg: null,
          brand_favicon_url: null,
          brand_primary_color: "#0d3b66",
          brand_secondary_color: "#f4d35e",
          brand_accent_color: "#f4d35e",
        },
      });
    }

    return NextResponse.json({
      success: true,
      branding: {
        brand_name: branding.brand_name,
        brand_name_line2: branding.brand_name_line2,
        brand_logo_url: branding.brand_logo_url,
        brand_logo_svg: branding.brand_logo_svg,
        brand_favicon_url: branding.brand_favicon_url,
        brand_primary_color: branding.brand_primary_color,
        brand_secondary_color: branding.brand_secondary_color,
        brand_accent_color: branding.brand_accent_color,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/branding:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
