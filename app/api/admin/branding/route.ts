// Admin Branding API
// GET /api/admin/branding - Get branding for current tenant
// PUT /api/admin/branding - Update branding for current tenant

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/branding
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!tenantUser) {
      return NextResponse.json(
        { success: false, error: "No tenant found" },
        { status: 404 }
      );
    }

    const tenantId = tenantUser.tenant_id;

    // Get branding for tenant
    const { data: branding, error } = await supabase
      .from("tenant_branding")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching branding:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch branding" },
        { status: 500 }
      );
    }

    // If no branding found, return defaults
    if (!branding) {
      return NextResponse.json({
        success: true,
        branding: {
          brand_name: "Associos",
          brand_name_line2: "Property Management",
          brand_logo_url: "",
          brand_logo_svg: "",
          brand_favicon_url: "",
          brand_primary_color: "#0d3b66",
          brand_secondary_color: "#f4d35e",
          brand_accent_color: "#f4d35e",
          support_email: "",
          support_phone: "",
          website_url: "",
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
        support_email: branding.support_email,
        support_phone: branding.support_phone,
        website_url: branding.website_url,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/branding:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/branding
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!tenantUser) {
      return NextResponse.json(
        { success: false, error: "No tenant found" },
        { status: 404 }
      );
    }

    const tenantId = tenantUser.tenant_id;

    // Parse request body
    const body = await request.json();

    // Upsert branding (insert if not exists, update if exists)
    const { data: branding, error } = await supabase
      .from("tenant_branding")
      .upsert({
        tenant_id: tenantId,
        brand_name: body.brand_name,
        brand_name_line2: body.brand_name_line2,
        brand_logo_url: body.brand_logo_url,
        brand_logo_svg: body.brand_logo_svg,
        brand_favicon_url: body.brand_favicon_url,
        brand_primary_color: body.brand_primary_color,
        brand_secondary_color: body.brand_secondary_color,
        brand_accent_color: body.brand_accent_color,
        support_email: body.support_email,
        support_phone: body.support_phone,
        website_url: body.website_url,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "tenant_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving branding:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save branding" },
        { status: 500 }
      );
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
        support_email: branding.support_email,
        support_phone: branding.support_phone,
        website_url: branding.website_url,
      },
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/branding:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
