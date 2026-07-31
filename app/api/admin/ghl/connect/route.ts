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
      const { accessToken, refreshToken, locationId: providedLocationId } = body;

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
      let testError = "";
      
      try {
        // Try v2 API first
        let testResponse = await fetch("https://services.leadconnectorhq.com/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Version": "2021-07-28",
            "Accept": "application/json",
          },
        });

        // If v2 fails with 401, try v1 API
        if (!testResponse.ok && testResponse.status === 401) {
          console.log("V2 API failed, trying v1 API...");
          testResponse = await fetch("https://rest.gohighlevel.com/v1/locations/me", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Accept": "application/json",
            },
          });
        }

        if (testResponse.ok) {
          const data = await testResponse.json();
          // Handle different response formats
          locationData = {
            id: data.id || data.location?.id,
            name: data.name || data.location?.name,
            companyId: data.companyId || data.location?.companyId,
          };
          testSuccess = true;
        } else {
          testError = `HTTP ${testResponse.status}: ${await testResponse.text()}`;
          console.warn("GHL OAuth test failed:", testError);
        }
      } catch (apiError) {
        testError = apiError instanceof Error ? apiError.message : "Network error";
        console.warn("GHL OAuth test failed (network error):", testError);
      }

      // Calculate token expiry (GHL tokens typically expire in 24 hours)
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);

      // Store credentials even if test failed
      // Use provided locationId if API test failed
      await storeGhlCredentials({
        type: "oauth",
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry.toISOString(),
        locationId: locationData.id || providedLocationId,
        locationName: locationData.name,
        companyId: locationData.companyId,
      });

      return NextResponse.json({
        success: true,
        message: testSuccess 
          ? "Connected successfully via OAuth" 
          : "Credentials saved but connection test failed. The token may be expired or invalid.",
        connectionType: "oauth",
        locationId: locationData.id,
        locationName: locationData.name,
        companyId: locationData.companyId,
        testSuccess,
        testError: testError || undefined,
      });

    } else if (type === "api_key") {
      // API Key connection (legacy)
      const { apiKey, locationId: providedLocationId } = body;

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
      let testError = "";
      
      try {
        const testResponse = await fetch("https://rest.gohighlevel.com/v1/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "application/json",
          },
        });

        if (testResponse.ok) {
          locationData = await testResponse.json();
          testSuccess = true;
        } else {
          testError = `HTTP ${testResponse.status}: ${await testResponse.text()}`;
          console.warn("GHL API key test failed:", testError);
        }
      } catch (apiError) {
        testError = apiError instanceof Error ? apiError.message : "Network error";
        console.warn("GHL API key test failed (network error):", testError);
      }

      // Store credentials
      // Use provided locationId if API test failed
      await storeGhlCredentials({
        type: "api_key",
        apiKey,
        locationId: locationData.id || providedLocationId,
        locationName: locationData.name,
      });

      return NextResponse.json({
        success: true,
        message: testSuccess 
          ? "Connected successfully via API Key" 
          : "Credentials saved but connection test failed. The API key may be invalid.",
        connectionType: "api_key",
        locationId: locationData.id,
        locationName: locationData.name,
        testSuccess,
        testError: testError || undefined,
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
