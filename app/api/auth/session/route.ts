import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// GET - Fetch current session with business info
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      id: session.id,
      email: session.email,
      businessId: session.businessId,
      tenants: session.tenants,
      roles: session.roles,
    });
  } catch (error) {
    console.error("Error in GET /api/auth/session:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
