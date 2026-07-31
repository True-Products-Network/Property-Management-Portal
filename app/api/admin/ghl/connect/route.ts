import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";

// POST /api/admin/ghl/connect - Connect to GHL with API Key or OAuth tokens
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (type === "oauth") {
      // OAuth Token connection
      const { accessToken, refreshToken } = body;

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

      // Test the token by calling GHL's location info endpoint
      try {
        const testResponse = await fetch("https://services.leadconnectorhq.com/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Version": "2021-07-28",
          },
        });

        if (!testResponse.ok) {
          const errorData = await testResponse.json().catch(() => ({}));
          console.error("GHL OAuth test failed:", errorData);
          return NextResponse.json(
            { error: "Invalid token or insufficient permissions. Please check your token and try again." },
            { status: 400 }
          );
        }

        const locationData = await testResponse.json();

        return NextResponse.json({
          success: true,
          message: "Connected successfully via OAuth",
          connectionType: "oauth",
          locationId: locationData.id,
          locationName: locationData.name,
          companyId: locationData.companyId,
        });
      } catch (apiError) {
        console.error("GHL OAuth API error:", apiError);
        return NextResponse.json(
          { error: "Failed to validate token with GHL. Please check your token and try again." },
          { status: 400 }
        );
      }
    } else if (type === "api_key") {
      // API Key connection (legacy)
      const { apiKey } = body;

      if (!apiKey) {
        return NextResponse.json(
          { error: "API key is required" },
          { status: 400 }
        );
      }

      // Validate API key format
      if (!apiKey.startsWith("ey") || apiKey.length < 20) {
        return NextResponse.json(
          { error: "Invalid API key format" },
          { status: 400 }
        );
      }

      // Test the API key
      try {
        const testResponse = await fetch("https://rest.gohighlevel.com/v1/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        });

        if (!testResponse.ok) {
          const errorData = await testResponse.json().catch(() => ({}));
          console.error("GHL API key test failed:", errorData);
          return NextResponse.json(
            { error: "Invalid API key. Please check your key and try again." },
            { status: 400 }
          );
        }

        const locationData = await testResponse.json();

        return NextResponse.json({
          success: true,
          message: "Connected successfully via API Key",
          connectionType: "api_key",
          locationId: locationData.id,
          locationName: locationData.name,
        });
      } catch (apiError) {
        console.error("GHL API key error:", apiError);
        return NextResponse.json(
          { error: "Failed to validate API key with GHL. Please check your key and try again." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid connection type. Use 'oauth' or 'api_key'." },
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
