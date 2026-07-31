import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";

// POST /api/admin/ghl/connect - Connect to GHL with API key
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Validate the API key with GHL
    // 2. Store the encrypted API key in the database
    // 3. Set up webhooks
    // 4. Fetch location info

    // Mock validation - in production, make actual GHL API call
    const isValid = apiKey.startsWith("ey") && apiKey.length > 20;

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 400 }
      );
    }

    // Mock successful connection
    return NextResponse.json({
      success: true,
      message: "Connected successfully",
      locationId: "mock-location-id",
      locationName: "Test Location",
    });
  } catch (error) {
    console.error("Error connecting to GHL:", error);
    return NextResponse.json(
      { error: "Failed to connect" },
      { status: 500 }
    );
  }
}
