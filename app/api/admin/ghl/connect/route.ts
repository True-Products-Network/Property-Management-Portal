import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/ghl/crypto";

// POST /api/admin/ghl/connect - Connect association to GHL
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
    const { associationId, credentials } = body;

    if (!associationId) {
      return NextResponse.json(
        { error: "Association ID is required" },
        { status: 400 }
      );
    }

    if (!credentials || !credentials.type) {
      return NextResponse.json(
        { error: "Credentials are required" },
        { status: 400 }
      );
    }

    const { type } = credentials;
    const supabase = await createClient();

    // Verify association exists
    const { data: association, error: assocError } = await supabase
      .from("associations")
      .select("id, name")
      .eq("id", associationId)
      .single();

    if (assocError || !association) {
      return NextResponse.json(
        { error: "Association not found" },
        { status: 404 }
      );
    }

    if (type === "oauth") {
      // OAuth Token connection
      const { accessToken, refreshToken, locationId: providedLocationId } = credentials;

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
        const testLocationId = providedLocationId || "me";
        
        // Try v2 API with specific location ID
        let testResponse = await fetch(`https://services.leadconnectorhq.com/locations/${testLocationId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Version": "2021-07-28",
            "Accept": "application/json",
          },
        });

        // If v2 fails with 401/403, try v1 API
        if (!testResponse.ok && (testResponse.status === 401 || testResponse.status === 403)) {
          console.log("V2 API failed, trying v1 API...");
          testResponse = await fetch(`https://rest.gohighlevel.com/v1/locations/${testLocationId}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Accept": "application/json",
            },
          });
        }

        if (testResponse.ok) {
          const data = await testResponse.json();
          locationData = {
            id: data.id || data.location?.id,
            name: data.name || data.location?.name,
            companyId: data.companyId || data.location?.companyId,\          };
          testSuccess = true;
        } else {
          testError = `HTTP ${testResponse.status}: ${await testResponse.text()}`;
          console.warn("GHL OAuth test failed:", testError);
        }
      } catch (apiError) {
        testError = apiError instanceof Error ? apiError.message : "Network error";
        console.warn("GHL OAuth test failed (network error):", testError);
      }

      // Calculate token expiry
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);

      // Store credentials in association_ghl_credentials table
      const { error: insertError } = await supabase
        .from("association_ghl_credentials")
        .upsert({
          association_id: associationId,
          type: "oauth",
          access_token: encrypt(accessToken),
          refresh_token: encrypt(refreshToken),
          token_expiry: tokenExpiry.toISOString(),
          location_id: locationData.id || providedLocationId,
          location_name: locationData.name,
          company_id: locationData.companyId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "association_id",
        });

      if (insertError) {
        console.error("Error storing credentials:", insertError);
        return NextResponse.json(
          { error: "Failed to store credentials" },
          { status: 500 }
        );
      }

      // Update association with GHL IDs
      await supabase
        .from("associations")
        .update({
          ghl_location_id: locationData.id || providedLocationId,
          ghl_location_name: locationData.name,
          ghl_company_id: locationData.companyId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", associationId);

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
      // API Key connection
      const { apiKey, locationId: providedLocationId } = credentials;

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
        const testLocationId = providedLocationId || "me";
        
        const testResponse = await fetch(`https://rest.gohighlevel.com/v1/locations/${testLocationId}`, {
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

      // Store credentials in association_ghl_credentials table
      const { error: insertError } = await supabase
        .from("association_ghl_credentials")
        .upsert({
          association_id: associationId,
          type: "api_key",
          api_key: encrypt(apiKey),
          location_id: locationData.id || providedLocationId,
          location_name: locationData.name,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "association_id",
        });

      if (insertError) {
        console.error("Error storing credentials:", insertError);
        return NextResponse.json(
          { error: "Failed to store credentials" },
          { status: 500 }
        );
      }

      // Update association with GHL IDs
      await supabase
        .from("associations")
        .update({
          ghl_location_id: locationData.id || providedLocationId,
          ghl_location_name: locationData.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", associationId);

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
