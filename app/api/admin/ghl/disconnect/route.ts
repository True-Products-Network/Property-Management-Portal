import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { clearGhlCredentials } from "@/lib/ghl/credentials";

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

    // Clear stored credentials
    await clearGhlCredentials();

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
