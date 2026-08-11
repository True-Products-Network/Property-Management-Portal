// Maintenance Requests API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMaintenanceRequests, createMaintenanceRequest } from "@/lib/api/maintenance";
import { checkRouteEntitlement, incrementEntitlementUsage } from "@/lib/entitlements/api-middleware";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";
import { z } from "zod";

const createSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  reportedByContactId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(), // Allow any string, validation is case-insensitive
  urgency: z.enum(["emergency", "urgent", "normal", "low"]).optional(),
  requestedDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);

  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(context, "MAINTENANCE_LIST", "maintenance_request", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { searchParams } = new URL(request.url);
    const result = await getMaintenanceRequests({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      search: searchParams.get("search") || undefined,
      associationId: searchParams.get("associationId") || undefined,
      propertyId: searchParams.get("propertyId") || undefined,
      unitId: searchParams.get("unitId") || undefined,
      status: searchParams.get("status") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      reportedBy: searchParams.get("reportedBy") || undefined,
      businessId: user.businessId,
      tenantId: user.tenantId, // CRITICAL: Pass tenant ID for isolation
    });

    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "MAINTENANCE_LIST", "maintenance_request", new Error(result.error || "Failed to fetch maintenance requests"), { durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "MAINTENANCE_LIST", "maintenance_request", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);

  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(context, "MAINTENANCE_CREATE", "maintenance_request", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    // Check entitlements
    const entitlementCheck = await checkRouteEntitlement(request, "maintenance_requests");
    if (!entitlementCheck.allowed) {
      await auditLoggers.error(context, "MAINTENANCE_CREATE", "maintenance_request", new Error(entitlementCheck.error || "Feature not available"), { entitlementCheck });
      return NextResponse.json({ 
        success: false, 
        error: entitlementCheck.error || "Feature not available",
        code: "NOT_ENTITLED"
      }, { status: 403 });
    }

    const body = await request.json();
    console.log("[Maintenance API] Received body:", JSON.stringify(body, null, 2));
    
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Maintenance API] Validation failed:", validation.error.flatten().fieldErrors);
      await auditLoggers.error(context, "MAINTENANCE_CREATE", "maintenance_request", new Error("Validation failed"), { validationErrors: validation.error.flatten().fieldErrors });
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    console.log("[Maintenance API] Creating with data:", validation.data, "userId:", user.id);
    const result = await createMaintenanceRequest(validation.data, user.id);
    console.log("[Maintenance API] Result:", result);
    
    const duration = Date.now() - startTime;

    if (!result.success) {
      console.error("[Maintenance API] Failed:", result.error);
      await auditLoggers.error(context, "MAINTENANCE_CREATE", "maintenance_request", new Error(result.error || "Failed to create maintenance request"), { data: validation.data, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    // Increment usage if entitled
    if (entitlementCheck.tenantId) {
      try {
        await incrementEntitlementUsage(entitlementCheck.tenantId, "maintenance_requests");
      } catch (err) {
        console.error("Error incrementing entitlement usage:", err);
      }
    }

    await auditLoggers.create(context, "maintenance_request", result.data?.id || "unknown", validation.data.title, validation.data, { durationMs: duration });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "MAINTENANCE_CREATE", "maintenance_request", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
