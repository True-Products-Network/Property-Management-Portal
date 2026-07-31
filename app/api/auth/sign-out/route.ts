import { NextRequest, NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth/session";
import { auditLogger } from "@/lib/audit/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (user) {
      // Log sign out
      await auditLogger.logAuditEvent({
        actorId: user.id,
        role: user.roles[0],
        action: "sign_out",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      });
    }

    await destroySession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { message: "An error occurred during sign out" },
      { status: 500 }
    );
  }
}
