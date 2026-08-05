import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/platform/integrations/ghl/test - Test GHL connection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is platform admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is platform admin via platform_user_roles table
    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .maybeSingle();

    const isPlatformAdmin = platformRole?.role === 'admin' || platformRole?.role === 'PLATFORM_ADMIN' || user.user_metadata?.is_platform_admin === true;
    
    if (!isPlatformAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden - Platform admin required" }, { status: 403 });
    }

    const body = await request.json();
    const { ghl_api_token, ghl_location_id } = body;

    if (!ghl_api_token || !ghl_location_id) {
      return NextResponse.json(
        { success: false, error: "API Token and Location ID are required" },
        { status: 400 }
      );
    }

    // Try GHL v2 API first (new OAuth-based API)
    // V2 uses 'Authorization: Bearer TOKEN' header
    const v2Response = await fetch(`https://services.leadconnectorhq.com/locations/${ghl_location_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${ghl_api_token}`,
        "Version": "2021-07-28",
        "Accept": "application/json",
      },
    });

    if (v2Response.ok) {
      const locationData = await v2Response.json();
      return NextResponse.json({
        success: true,
        message: `Successfully connected to GHL location: ${locationData.name || locationData.id}`,
        location: {
          id: locationData.id,
          name: locationData.name,
          address: locationData.address,
        },
      });
    }

    // If v2 fails, try v1 API (legacy, deprecated)
    const v1Response = await fetch(`https://rest.gohighlevel.com/v1/locations/${ghl_location_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${ghl_api_token}`,
        "Content-Type": "application/json",
      },
    });

    if (v1Response.ok) {
      const locationData = await v1Response.json();
      return NextResponse.json({
        success: true,
        message: `Successfully connected to GHL location: ${locationData.name || locationData.id}`,
        location: {
          id: locationData.id,
          name: locationData.name,
          address: locationData.address,
        },
      });
    }

    // Both failed - analyze error
    const v2Error = await v2Response.text();
    const v1Error = await v1Response.text();
    console.error("GHL v2 API error:", v2Error);
    console.error("GHL v1 API error:", v1Error);

    // Check for specific error messages
    if (v2Error.includes("Unauthorized") || v1Error.includes("Unauthorized")) {
      return NextResponse.json({
        success: false,
        error: "Invalid API Token. GHL has switched to v2 API. Please generate a new token from GHL → Settings → Private Integrations with the following scopes: locations.readonly, contacts.write, contacts.readonly",
      }, { status: 200 });
    }

    if (v2Response.status === 404 || v1Response.status === 404) {
      return NextResponse.json({
        success: false,
        error: "Location ID not found. Please verify your Location ID.",
      }, { status: 200 });
    }

    return NextResponse.json({
      success: false,
      error: `GHL API error. Please ensure you're using a v2 API token with proper scopes (locations.readonly, contacts.write, contacts.readonly)`,
    }, { status: 200 });

  } catch (error) {
    console.error("Error testing GHL connection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to test connection - Please check your credentials" },
      { status: 500 }
    );
  }
}
