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

    // Get credentials from request body or environment
    const body = await request.json().catch(() => ({}));
    const { 
      type: requestType, 
      accessToken: reqAccessToken, 
      refreshToken: reqRefreshToken, 
      apiKey: reqApiKey 
    } = body;

    // Determine which credentials to use
    let type = requestType;
    let accessToken = reqAccessToken || process.env.GHL_ACCESS_TOKEN;
    let refreshToken = reqRefreshToken || process.env.GHL_REFRESH_TOKEN;
    let apiKey = reqApiKey || process.env.GHL_API_KEY;

    // Auto-detect type if not specified
    if (!type) {
      if (accessToken && refreshToken) {
        type = "oauth";
      } else if (apiKey) {
        type = "api_key";
      }
    }

    if (!accessToken && !apiKey) {
      return NextResponse.json(
        { error: "No credentials provided or configured" },
        { status: 400 }
      );
    }

    // Test OAuth connection
    if (type === "oauth" && accessToken) {
      try {
        const testResponse = await fetch("https://services.leadconnectorhq.com/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Version": "2021-07-28",
          },
        });

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error("GHL OAuth test failed:", testResponse.status, errorText);
          return NextResponse.json(
            { 
              error: "OAuth connection test failed", 
              details: `HTTP ${testResponse.status}: ${errorText}`,
              suggestion: "Your token may be expired or invalid. Try reconnecting with fresh tokens."
            },
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
          { 
            error: "OAuth connection test failed", 
            details: apiError instanceof Error ? apiError.message : "Network error",
            suggestion: "Could not reach GHL API. Please check your network connection."
          },
          { status: 500 }
        );
      }
    }

    // Test API Key connection
    if (type === "api_key" && apiKey) {
      try {
        const testResponse = await fetch("https://rest.gohighlevel.com/v1/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        });

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error("GHL API key test failed:", testResponse.status, errorText);
          return NextResponse.json(
            { 
              error: "API Key connection test failed", 
              details: `HTTP ${testResponse.status}: ${errorText}`,
              suggestion: "Your API key may be invalid. Please check your key and try again."
            },
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
          { 
            error: "API Key connection test failed", 
            details: apiError instanceof Error ? apiError.message : "Network error",
            suggestion: "Could not reach GHL API. Please check your network connection."
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "No valid credentials found for the specified connection type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error testing GHL connection:", error);
    return NextResponse.json(
      { error: "Connection test failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
