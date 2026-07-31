import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { getGhlCredentials } from "@/lib/ghl/credentials";

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

    // Get stored credentials
    const credentials = await getGhlCredentials();

    if (!credentials) {
      return NextResponse.json(
        { error: "No credentials configured. Please connect to GHL first." },
        { status: 400 }
      );
    }

    // Test OAuth connection
    if (credentials.type === "oauth" && credentials.accessToken) {
      try {
        // Try the newer v2 API first
        let testResponse = await fetch("https://services.leadconnectorhq.com/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${credentials.accessToken}`,
            "Version": "2021-07-28",
            "Accept": "application/json",
          },
        });

        // If that fails, try the v1 API
        if (!testResponse.ok && testResponse.status === 401) {
          console.log("Trying v1 API...");
          testResponse = await fetch("https://rest.gohighlevel.com/v1/locations/me", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${credentials.accessToken}`,
              "Accept": "application/json",
            },
          });
        }

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error("GHL OAuth test failed:", testResponse.status, errorText);
          
          // Provide more specific error messages
          let suggestion = "Your token may be expired or invalid.";
          if (testResponse.status === 401) {
            suggestion = "Authentication failed. The token may be expired or doesn't have the required scopes. Try generating a new token.";
          } else if (testResponse.status === 403) {
            suggestion = "Forbidden. The token doesn't have permission to access this resource.";
          } else if (testResponse.status === 404) {
            suggestion = "API endpoint not found. The token may be for a different GHL environment.";
          }
          
          return NextResponse.json(
            { 
              error: "OAuth connection test failed", 
              status: testResponse.status,
              details: errorText,
              suggestion,
              tokenPrefix: credentials.accessToken.substring(0, 10) + "...",
            },
            { status: 400 }
          );
        }

        const locationData = await testResponse.json();

        return NextResponse.json({
          success: true,
          message: "OAuth connection test successful",
          connectionType: "oauth",
          locationName: locationData.name || locationData.location?.name,
          locationId: locationData.id || locationData.location?.id,
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
    if (credentials.type === "api_key" && credentials.apiKey) {
      try {
        const testResponse = await fetch("https://rest.gohighlevel.com/v1/locations/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${credentials.apiKey}`,
            "Accept": "application/json",
          },
        });

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error("GHL API key test failed:", testResponse.status, errorText);
          
          let suggestion = "Your API key may be invalid.";
          if (testResponse.status === 401) {
            suggestion = "Authentication failed. The API key may be expired or invalid.";
          }
          
          return NextResponse.json(
            { 
              error: "API Key connection test failed", 
              status: testResponse.status,
              details: errorText,
              suggestion,
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
