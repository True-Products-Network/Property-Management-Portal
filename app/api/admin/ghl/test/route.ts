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

    // In production, this would make an actual API call to GHL
    // to verify the connection is working

    // Mock test - simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: "Connection test successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error testing GHL connection:", error);
    return NextResponse.json(
      { error: "Connection test failed" },
      { status: 500 }
    );
  }
}
