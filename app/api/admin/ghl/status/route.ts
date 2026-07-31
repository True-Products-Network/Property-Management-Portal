import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { getGhlConnectionStatus } from "@/lib/ghl/credentials";

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

    const status = await getGhlConnectionStatus();
    console.log("[GHL Status API] Returning status:", status);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error checking GHL status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
