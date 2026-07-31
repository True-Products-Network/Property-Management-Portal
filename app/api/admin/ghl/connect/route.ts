import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { storeGhlCredentials } from "@/lib/ghl/credentials";

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

      // Basic validation
      if (accessToken.length < 20) {
        return NextResponse.json(
          { error: "Access token appears to be invalid (too short)" },
          { status: 400 }
        );
      }

      // Try to test the connection and get location info
      let locationData: { id?: string; name?: string; companyId?: string } = {};
      let testSuccess = false;
      
      try {
        const testResponse = await fetch("https://services.leadconnectorhq.com/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Version": "2021-07-28",
          },
        });

        if (testResponse.ok) {
          locationData = await testResponse.json();
          testSuccess = true;
        } else {
          console.warn("GHL OAuth test returned non-OK status:", testResponse.status);
        }
      } catch (apiError) {
        console.warn("GHL OAuth test failed (network error):", apiError);
      }

      // Store credentials
      await storeGhlCredentials({
        type: "oauth",
        accessToken,
        refreshToken,
        locationId: locationData.id,
        locationName: locationData.name,
        companyId: locationData.companyId,
      });

      return NextResponse.json({
        success: true,
        message: testSuccess 
          ? "Connected successfully via OAuth" 
          : "Credentials saved. Connection will be verified when GHL is reachable.",
        connectionType: "oauth",
        locationId: locationData.id,
        locationName: locationData.name,
        companyId: locationData.companyId,
        testSuccess,
      });

    } else if (type === "api_key") {
      // API Key connection (legacy)
      const { apiKey } = body;

      if (!apiKey) {
        return NextResponse.json(
          { error: "API key is required" },
          { status: 400 }
        );
      }

      // Basic validation
      if (apiKey.length < 10) {
        return NextResponse.json(
          { error: "API key appears to be invalid (too short)" },
          { status: 400 }
        );
      }

      // Try to test the connection and get location info
      let locationData: { id?: string; name?: string } = {};
      let testSuccess = false;
      
      try {
        const testResponse = await fetch("https://rest.gohighlevel.com/v1/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        });

        if (testResponse.ok) {
          locationData = await testResponse.json();
          testSuccess = true;
        } else {
          console.warn("GHL API key test returned non-OK status:", testResponse.status);
        }
      } catch (apiError) {
        console.warn("GHL API key test failed (network error):", apiError);
      }

      // Store credentials
      await storeGhlCredentials({
        type: "api_key",
        apiKey,
        locationId: locationData.id,
        locationName: locationData.name,
      });

      return NextResponse.json({
        success: true,
        message: testSuccess 
          ? "Connected successfully via API Key" 
          : "Credentials saved. Connection will be verified when GHL is reachable.",
        connectionType: "api_key",
        locationId: locationData.id,
        locationName: locationData.name,
        testSuccess,
      });

    } else {
      return NextResponse.json(
        { error: "Invalid connection type. Use 'oauth' or 'api_key'." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error connecting to GHL:", error);
    return NextResponse.json(
      { error: "Failed to connect: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
