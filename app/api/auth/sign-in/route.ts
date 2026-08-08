import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/schemas/portal/auth";
import { getDefaultRouteForRole } from "@/lib/permissions/roles";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const body = await request.json();
    
    // Validate input
    const result = signInSchema.safeParse(body);
    if (!result.success) {
      await auditLoggers.error(
        context,
        "USER_LOGIN",
        "user",
        new Error(`Validation failed: ${result.error.issues[0].message}`),
        { email: body.email }
      );
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
      await auditLoggers.loginFailed(context, {
        email,
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
      await auditLoggers.error(
        { ...context, userId: authData.user.id },
        "USER_LOGIN",
        "user",
        new Error("No portal access permissions found"),
        { email, userId: authData.user.id }
      );
      return NextResponse.json(
        { message: "No portal access permissions found" },
        { status: 403 }
      );
    }

    const duration = Date.now() - startTime;
    context.userId = authData.user.id;
    context.tenantId = userMetadata?.tenant_id;

    // Log successful sign in
    await auditLoggers.loginSuccess(context, {
      email,
      method: "email_password",
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
    const duration = Date.now() - startTime;
    await auditLoggers.error(
      context,
      "USER_LOGIN",
      "user",
      error instanceof Error ? error : new Error("An error occurred during sign in"),
      { durationMs: duration }
    );
    console.error("Sign in error:", error);
    return NextResponse.json(
      { message: "An error occurred during sign in" },
      { status: 500 }
    );
  }
}
