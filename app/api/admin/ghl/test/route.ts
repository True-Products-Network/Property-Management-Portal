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

    // In production, this would use the stored access token
    // and make an actual API call to GHL to verify the connection

    // Get the access token from environment or database
    const accessToken = process.env.GHL_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token configured" },
        { status: 400 }
      );
    }

    try {
      // Test the connection by calling GHL's location endpoint
      const testResponse = await fetch("https://services.leadconnectorhq.com/locations/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Version": "2021-07-28",
        },
      });

      if (!testResponse.ok) {
        const errorData = await testResponse.json().catch(() => ({}));
        console.error("GHL test connection failed:", errorData);
        return NextResponse.json(
          { error: "Connection test failed. Token may be expired or invalid." },
          { status: 400 }
        );
      }

      const locationData = await testResponse.json();

      return NextResponse.json({
        success: true,
        message: "Connection test successful",
        locationName: locationData.name,
        locationId: locationData.id,
        timestamp: new Date().toISOString(),
      });
    } catch (apiError) {
      console.error("GHL API error during test:", apiError);
      return NextResponse.json(
        { error: "Connection test failed. Could not reach GHL API." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error testing GHL connection:", error);
    return NextResponse.json(
      { error: "Connection test failed" },
      { status: 500 }
    );
  }
}
