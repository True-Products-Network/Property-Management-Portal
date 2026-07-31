import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/schemas/portal/auth";
import { mockGhlAdapter } from "@/lib/ghl/mock-adapter";
import { getDefaultRouteForRole } from "@/lib/permissions/roles";
import { auditLogger } from "@/lib/audit/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = signInSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Create Supabase server client
    const supabase = await createClient();

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      // Log failed attempt
      await auditLogger.logAuditEvent({
        actorId: "anonymous",
        role: "unknown",
        action: "sign_in_failed",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        reason: authError?.message || "Invalid email or password",
      });

      return NextResponse.json(
        { message: authError?.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    // Get user metadata from Supabase
    const userMetadata = authData.user.user_metadata;
    const portalRoles = userMetadata?.roles || [];

    if (portalRoles.length === 0) {
      return NextResponse.json(
        { message: "No portal access permissions found" },
        { status: 403 }
      );
    }

    // Log successful sign in
    await auditLogger.logAuditEvent({
      actorId: authData.user.id,
      role: portalRoles[0],
      action: "sign_in_success",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Get redirect URL based on primary role
    const primaryRole = portalRoles[0];
    const redirectUrl = userMetadata?.redirect_url || getDefaultRouteForRole(primaryRole);

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        roles: portalRoles,
      },
      redirectUrl,
      session: authData.session,
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { message: "An error occurred during sign in" },
      { status: 500 }
    );
  }
}
