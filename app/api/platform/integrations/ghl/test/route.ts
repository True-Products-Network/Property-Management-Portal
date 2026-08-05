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

    // Test connection by fetching location details from GHL
    const ghlResponse = await fetch(`https://rest.gohighlevel.com/v1/locations/${ghl_location_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${ghl_api_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      console.error("GHL API error:", errorText);
      
      if (ghlResponse.status === 401) {
        return NextResponse.json(
          { success: false, error: "Invalid API Token - Authentication failed" },
          { status: 200 }
        );
      }
      
      if (ghlResponse.status === 404) {
        return NextResponse.json(
          { success: false, error: "Location ID not found - Please verify your Location ID" },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { success: false, error: `GHL API error: ${ghlResponse.statusText}` },
        { status: 200 }
      );
    }

    const locationData = await ghlResponse.json();

    return NextResponse.json({
      success: true,
      message: `Successfully connected to GHL location: ${locationData.name || locationData.id}`,
      location: {
        id: locationData.id,
        name: locationData.name,
        address: locationData.address,
      },
    });
  } catch (error) {
    console.error("Error testing GHL connection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to test connection - Please check your credentials" },
      { status: 500 }
    );
  }
}
