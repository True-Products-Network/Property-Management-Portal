// Properties API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getProperties, createProperty } from "@/lib/api/properties";
import { checkRouteEntityLimit } from "@/lib/entitlements/entity-limits";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";
import { z } from "zod";

const createSchema = z.object({
  associationId: z.string().uuid(),
  name: z.string().min(1),
  addressStreet: z.string().min(1),
  addressCity: z.string().optional().nullable(),
  addressState: z.string().optional().nullable(),
  addressZip: z.string().optional().nullable(),
  type: z.string().refine((val) => 
    ['condominium', 'apartment', 'townhouse', 'single family', 'single_family', 'commercial', 'mixed use', 'mixed_use'].includes(val.toLowerCase()),
    { message: "Invalid property type" }
  ),
  status: z.enum(["active", "inactive", "under_construction"]).optional().nullable(),
  yearBuilt: z.number().optional().nullable(),
  totalUnits: z.number().optional().nullable(),
  managementStartDate: z.string().optional().nullable(),
  accessInstructions: z.string().optional().nullable(),
  emergencyNotes: z.string().optional().nullable(),
  assignedStaffId: z.string().uuid().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(context, "PROPERTY_LIST", "property", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const result = await getProperties({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      search: searchParams.get("search") || undefined,
      associationId: searchParams.get("associationId") || undefined,
      filters: status ? { status } : undefined,
      businessId: user.businessId,
      tenantId: user.tenantId, // CRITICAL: Pass tenant ID for isolation
    });

    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "PROPERTY_LIST", "property", new Error(result.error || "Failed to fetch properties"), { durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "PROPERTY_LIST", "property", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(context, "PROPERTY_CREATE", "property", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    // Check entity limits
    const limitCheck = await checkRouteEntityLimit(request, "properties");
    if (!limitCheck.allowed) {
      await auditLoggers.error(context, "PROPERTY_CREATE", "property", new Error(limitCheck.error || "Property limit reached"), { limitCheck });
      return NextResponse.json({ 
        success: false, 
        error: limitCheck.error || "Property limit reached",
        code: "LIMIT_REACHED",
        current: limitCheck.remaining !== undefined ? limitCheck.remaining + 1 : undefined,
        limit: limitCheck.remaining !== undefined ? limitCheck.remaining : undefined,
      }, { status: 403 });
    }

    const body = await request.json();
    console.log("[Properties API POST] Received body:", JSON.stringify(body, null, 2));
    
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Properties API POST] Validation failed:", validation.error.flatten().fieldErrors);
      await auditLoggers.error(context, "PROPERTY_CREATE", "property", new Error("Validation failed"), { validationErrors: validation.error.flatten().fieldErrors });
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await createProperty(validation.data, user.id, limitCheck.tenantId);
    const duration = Date.now() - startTime;

    if (!result.success) {
      console.error("[Properties API POST] createProperty failed:", result.error);
      await auditLoggers.error(context, "PROPERTY_CREATE", "property", new Error(result.error || "Failed to create property"), { data: validation.data, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    await auditLoggers.create(context, "property", result.data?.id || "unknown", validation.data.name, validation.data, { durationMs: duration });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "PROPERTY_CREATE", "property", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
