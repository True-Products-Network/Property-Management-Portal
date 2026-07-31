import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";

// POST /api/admin/ghl/connect - Connect to GHL with OAuth tokens
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken } = await request.json();

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Both access token and refresh token are required" },
        { status: 400 }
      );
    }

    // Validate token format (GHL tokens are JWTs that start with "ey")
    if (!accessToken.startsWith("ey") || accessToken.length < 50) {
      return NextResponse.json(
        { error: "Invalid access token format. Token should be a valid JWT." },
        { status: 400 }
      );
    }

    if (!refreshToken.startsWith("ey") && refreshToken.length < 20) {
      return NextResponse.json(
        { error: "Invalid refresh token format" },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Validate the tokens with GHL by making a test API call
    // 2. Store the encrypted tokens in the database
    // 3. Extract location/company info from the token
    // 4. Set up webhooks
    // 5. Start token refresh scheduler

    // Mock validation - make a test call to GHL
    try {
      // Test the token by calling GHL's location info endpoint
      const testResponse = await fetch("https://services.leadconnectorhq.com/locations/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Version": "2021-07-28",
        },
      });

      if (!testResponse.ok) {
        const errorData = await testResponse.json().catch(() => ({}));
        console.error("GHL API test failed:", errorData);
        return NextResponse.json(
          { error: "Invalid token or insufficient permissions. Please check your token and try again." },
          { status: 400 }
        );
      }

      const locationData = await testResponse.json();

      // Store tokens (in production, encrypt these)
      // For now, we'll just return success
      return NextResponse.json({
        success: true,
        message: "Connected successfully",
        locationId: locationData.id,
        locationName: locationData.name,
        companyId: locationData.companyId,
      });
    } catch (apiError) {
      console.error("GHL API error:", apiError);
      return NextResponse.json(
        { error: "Failed to validate token with GHL. Please check your token and try again." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error connecting to GHL:", error);
    return NextResponse.json(
      { error: "Failed to connect" },
      { status: 500 }
    );
  }
}
