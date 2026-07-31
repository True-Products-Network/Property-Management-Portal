import { NextRequest, NextResponse } from "next/server";
import { signInSchema } from "@/schemas/portal/auth";
import { createSession } from "@/lib/auth/session";
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
        { message: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // In a real implementation, verify password against database
    // For now, use mock adapter to find contact
    const contact = await mockGhlAdapter.getContactByEmail(email);

    if (!contact) {
      // Log failed attempt
      await auditLogger.logAuditEvent({
        actorId: "anonymous",
        role: "unknown",
        action: "sign_in_failed",
        ipAddress: request.ip || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        reason: "Invalid email or password",
      });

      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check portal access status
    if (contact.portalAccessStatus !== "active") {
      return NextResponse.json(
        { message: "Account is not active. Please contact support." },
        { status: 403 }
      );
    }

    // Map GHL roles to portal roles
    const portalRoles = contact.roles.map((role) => {
      switch (role) {
        case "Admin User":
          return "ADMIN_USER" as const;
        case "Property Manager":
        case "Maintenance Coordinator":
        case "Staff":
          return "MANAGEMENT_STAFF" as const;
        case "Owner":
          return "OWNER" as const;
        case "Resident":
        case "Tenant":
          return "RESIDENT" as const;
        case "Board President":
        case "Board Treasurer":
        case "Board Secretary":
        case "Board Member":
          return "BOARD_MEMBER" as const;
        case "Vendor Contact":
          return "VENDOR" as const;
        default:
          return null;
      }
    }).filter(Boolean) as ("ADMIN_USER" | "MANAGEMENT_STAFF" | "OWNER" | "RESIDENT" | "BOARD_MEMBER" | "VENDOR")[];

    if (portalRoles.length === 0) {
      return NextResponse.json(
        { message: "No portal access permissions found" },
        { status: 403 }
      );
    }

    // Create session
    const sessionUser = {
      id: `PORTAL-${contact.id}`,
      email: contact.email,
      ghlContactId: contact.id,
      roles: portalRoles,
      mfaEnabled: false, // TODO: Check if MFA is required
      status: "ACTIVE" as const,
    };

    await createSession(sessionUser);

    // Log successful sign in
    await auditLogger.logAuditEvent({
      actorId: sessionUser.id,
      role: portalRoles[0],
      action: "sign_in_success",
      ipAddress: request.ip || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Get redirect URL based on primary role
    const primaryRole = portalRoles[0];
    const redirectUrl = getDefaultRouteForRole(primaryRole);

    return NextResponse.json({
      success: true,
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        roles: sessionUser.roles,
      },
      redirectUrl,
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { message: "An error occurred during sign in" },
      { status: 500 }
    );
  }
}
