import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLogger } from "@/lib/audit/logger";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user before signing out
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const roles = user.user_metadata?.roles || [];
      
      // Log sign out
      await auditLogger.logAuditEvent({
        actorId: user.id,
        role: roles[0] || "unknown",
        action: "sign_out",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      });
    }

    // Sign out from Supabase
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { message: "An error occurred during sign out" },
      { status: 500 }
    );
  }
}
