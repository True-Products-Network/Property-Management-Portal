import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";

// GET /api/admin/ghl/status - Check GHL connection status
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // In production, this would check the database for stored credentials
    // and verify the connection to GHL
    const status = {
      connected: process.env.GHL_API_KEY ? true : false,
      apiKeyConfigured: process.env.GHL_API_KEY ? true : false,
      webhooksConfigured: process.env.GHL_WEBHOOK_SECRET ? true : false,
      locationId: process.env.GHL_LOCATION_ID,
      locationName: process.env.GHL_LOCATION_NAME,
      lastSync: null,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error checking GHL status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
