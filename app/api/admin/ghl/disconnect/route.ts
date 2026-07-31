import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";

// POST /api/admin/ghl/disconnect - Disconnect from GHL
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // In production, this would:
    // 1. Remove stored credentials from database
    // 2. Delete webhooks from GHL
    // 3. Clear any cached data

    return NextResponse.json({
      success: true,
      message: "Disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting from GHL:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
