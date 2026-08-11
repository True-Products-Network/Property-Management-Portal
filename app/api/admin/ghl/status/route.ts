import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { getAssociationGhlCredentials } from "@/lib/ghl/association-credentials";
import { createClient } from "@/lib/supabase/server";

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

    // Get credentials for this association (with auto-refresh if needed)
    const credentials = await getAssociationGhlCredentials(associationId);

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
      const hasAccessToken = !!credentials.accessToken;
      const hasRefreshToken = !!credentials.refreshToken;
      
      // Check if token is expired
      let isExpired = false;
      if (credentials.tokenExpiry) {
        const expiryDate = new Date(credentials.tokenExpiry);
        isExpired = expiryDate < new Date();
      }
      
      isConnected = hasAccessToken && hasRefreshToken && !isExpired;
    } else if (credentials.type === "api_key") {
      isConnected = !!credentials.apiKey;
    }

    return NextResponse.json({
      connected: isConnected,
      connectionType: credentials.type,
      apiKeyConfigured: credentials.type === "api_key" && !!credentials.apiKey,
      accessTokenConfigured: credentials.type === "oauth" && !!credentials.accessToken,
      refreshTokenConfigured: credentials.type === "oauth" && !!credentials.refreshToken,
      webhooksConfigured: !!process.env.GHL_WEBHOOK_SECRET,
      locationId: credentials.locationId || association?.ghl_location_id,
      locationName: credentials.locationName || association?.ghl_location_name,
      companyId: credentials.companyId || association?.ghl_company_id,
      lastSync: credentials.connectedAt,
    });
  } catch (error) {
    console.error("Error checking GHL status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
