import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";

// POST /api/admin/ghl/test - Test GHL connection
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Determine connection type and get credentials
    const hasApiKey = !!process.env.GHL_API_KEY;
    const hasAccessToken = !!process.env.GHL_ACCESS_TOKEN;

    if (!hasApiKey && !hasAccessToken) {
      return NextResponse.json(
        { error: "No credentials configured" },
        { status: 400 }
      );
    }

    // Test OAuth connection
    if (hasAccessToken) {
      try {
        const testResponse = await fetch("https://services.leadconnectorhq.com/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${process.env.GHL_ACCESS_TOKEN}`,
            "Version": "2021-07-28",
          },
        });

        if (!testResponse.ok) {
          const errorData = await testResponse.json().catch(() => ({}));
          console.error("GHL OAuth test failed:", errorData);
          return NextResponse.json(
            { error: "OAuth connection test failed. Token may be expired or invalid." },
            { status: 400 }
          );
        }

        const locationData = await testResponse.json();

        return NextResponse.json({
          success: true,
          message: "OAuth connection test successful",
          connectionType: "oauth",
          locationName: locationData.name,
          locationId: locationData.id,
          timestamp: new Date().toISOString(),
        });
      } catch (apiError) {
        console.error("GHL OAuth API error during test:", apiError);
        return NextResponse.json(
          { error: "OAuth connection test failed. Could not reach GHL API." },
          { status: 500 }
        );
      }
    }

    // Test API Key connection
    if (hasApiKey) {
      try {
        const testResponse = await fetch("https://rest.gohighlevel.com/v1/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${process.env.GHL_API_KEY}`,
          },
        });

        if (!testResponse.ok) {
          const errorData = await testResponse.json().catch(() => ({}));
          console.error("GHL API key test failed:", errorData);
          return NextResponse.json(
            { error: "API Key connection test failed. Key may be invalid." },
            { status: 400 }
          );
        }

        const locationData = await testResponse.json();

        return NextResponse.json({
          success: true,
          message: "API Key connection test successful",
          connectionType: "api_key",
          locationName: locationData.name,
          locationId: locationData.id,
          timestamp: new Date().toISOString(),
        });
      } catch (apiError) {
        console.error("GHL API key error during test:", apiError);
        return NextResponse.json(
          { error: "API Key connection test failed. Could not reach GHL API." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "No valid credentials found" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error testing GHL connection:", error);
    return NextResponse.json(
      { error: "Connection test failed" },
      { status: 500 }
    );
  }
}
