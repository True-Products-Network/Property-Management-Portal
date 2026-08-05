import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/ghl/crypto";

// GET /api/admin/ghl/status - Check GHL connection status for an association
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const associationId = searchParams.get("associationId");

    if (!associationId) {
      return NextResponse.json(
        { error: "Association ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get credentials for this association
    const { data: credentials, error } = await supabase
      .from("association_ghl_credentials")
      .select("*")
      .eq("association_id", associationId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching credentials:", error);
      return NextResponse.json(
        { error: "Failed to fetch credentials" },
        { status: 500 }
      );
    }

    // Also get association info
    const { data: association } = await supabase
      .from("associations")
      .select("ghl_location_id, ghl_location_name, ghl_company_id")
      .eq("id", associationId)
      .single();

    if (!credentials) {
      return NextResponse.json({
        connected: false,
        connectionType: null,
        apiKeyConfigured: false,
        accessTokenConfigured: false,
        refreshTokenConfigured: false,
        webhooksConfigured: false,
        locationId: association?.ghl_location_id,
        locationName: association?.ghl_location_name,
        companyId: association?.ghl_company_id,
      });
    }

    // Check if credentials are valid
    let isConnected = false;
    
    if (credentials.type === "oauth") {
      const hasAccessToken = !!credentials.access_token;
      const hasRefreshToken = !!credentials.refresh_token;
      
      // Check if token is expired
      let isExpired = false;
      if (credentials.token_expiry) {
        const expiryDate = new Date(credentials.token_expiry);
        isExpired = expiryDate < new Date();
      }
      
      isConnected = hasAccessToken && hasRefreshToken && !isExpired;
    } else if (credentials.type === "api_key") {
      isConnected = !!credentials.api_key;
    }

    return NextResponse.json({
      connected: isConnected,
      connectionType: credentials.type,
      apiKeyConfigured: credentials.type === "api_key" && !!credentials.api_key,
      accessTokenConfigured: credentials.type === "oauth" && !!credentials.access_token,
      refreshTokenConfigured: credentials.type === "oauth" && !!credentials.refresh_token,
      webhooksConfigured: !!process.env.GHL_WEBHOOK_SECRET,
      locationId: credentials.location_id || association?.ghl_location_id,
      locationName: credentials.location_name || association?.ghl_location_name,
      companyId: credentials.company_id || association?.ghl_company_id,
      lastSync: credentials.updated_at,
      lastTested: credentials.last_tested_at,
    });
  } catch (error) {
    console.error("Error checking GHL status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
