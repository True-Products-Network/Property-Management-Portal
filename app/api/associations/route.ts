// Associations API Routes
// GET /api/associations - List associations
// POST /api/associations - Create association

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import {
  getAssociations,
  createAssociation,
} from "@/lib/api/associations";
import { checkRouteEntityLimit } from "@/lib/entitlements/entity-limits";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";
import { z } from "zod";

// Validation schema
const createAssociationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  legalName: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  status: z.string().optional().default("active"),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  mailingAddress: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  taxId: z.string().optional(),
  fiscalYear: z.string().optional(),
  fiscalYearEndMonth: z.string().optional(),
  fiscalYearEndDay: z.number().optional(),
  annualMeetingMonth: z.string().optional(),
  managementStartDate: z.string().optional(),
  assignedManagerId: z.string().uuid().optional(),
  financialPlatform: z.string().optional(),
  financialPortalLink: z.string().optional(),
  documentStorageLink: z.string().optional(),
  emergencyInstructions: z.string().optional(),
  generalNotes: z.string().optional(),
  propertyCount: z.number().optional(),
  unitCount: z.number().optional(),
});

// GET /api/associations
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    // Check authentication
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_LIST",
        "association",
        new Error("Unauthorized"),
        { path: request.nextUrl.pathname }
      );
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Get associations (filtered by business_id or tenant_id)
    console.log("[GET /api/associations] user.businessId:", user.businessId, "user.tenantId:", user.tenantId);
    const result = await getAssociations({
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      filters: status ? { status } : undefined,
    }, user.businessId, user.tenantId);

    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_LIST",
        "association",
        new Error(result.error || "Failed to fetch associations"),
        { page, pageSize, search, status, durationMs: duration }
      );
      return NextResponse.json(result, { status: 400 });
    }

    // Log successful list operation (low frequency, only log errors for list)
    // await auditLoggers.apiCall(context, "GET", "/api/associations", 200, duration, true, {
    //   page,
    //   pageSize,
    //   resultCount: result.data?.length || 0,
    // });

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("Error in GET /api/associations:", error);
    
    await auditLoggers.error(
      context,
      "ASSOCIATION_LIST",
      "association",
      error instanceof Error ? error : new Error("Internal server error"),
      { durationMs: duration }
    );
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST /api/associations
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    // Check authentication
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_CREATE",
        "association",
        new Error("Unauthorized"),
        { path: request.nextUrl.pathname }
      );
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    // Check admin permission
    if (!isAdmin(user.roles)) {
      await auditLoggers.securityEvent(
        context,
        "ASSOCIATION_CREATE_UNAUTHORIZED",
        "warning",
        { roles: user.roles }
      );
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Check entity limits
    const limitCheck = await checkRouteEntityLimit(request, "associations");
    if (!limitCheck.allowed) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_CREATE",
        "association",
        new Error(limitCheck.error || "Association limit reached"),
        { limitCheck }
      );
      return NextResponse.json({ 
        success: false, 
        error: limitCheck.error || "Association limit reached",
        code: "LIMIT_REACHED",
        current: limitCheck.remaining !== undefined ? limitCheck.remaining + 1 : undefined,
        limit: limitCheck.remaining !== undefined ? limitCheck.remaining : undefined,
      }, { status: 403 });
    }

    // Parse and validate body
    const body = await request.json();
    const validation = createAssociationSchema.safeParse(body);

    if (!validation.success) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_CREATE",
        "association",
        new Error("Validation failed"),
        { validationErrors: validation.error.flatten().fieldErrors }
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Create association (with business_id and tenant_id)
    console.log("[Associations API POST] Creating with data:", JSON.stringify(validation.data, null, 2));
    const result = await createAssociation(validation.data, user.id, user.businessId, user.tenantId);
    console.log("[Associations API POST] Create result:", JSON.stringify(result, null, 2));

    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_CREATE",
        "association",
        new Error(result.error || "Failed to create association"),
        { data: validation.data, durationMs: duration }
      );
      return NextResponse.json(result, { status: 400 });
    }

    // Log successful creation
    await auditLoggers.create(
      context,
      "association",
      result.data?.id || "unknown",
      validation.data.name,
      validation.data,
      { durationMs: duration }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("Error in POST /api/associations:", error);
    
    await auditLoggers.error(
      context,
      "ASSOCIATION_CREATE",
      "association",
      error instanceof Error ? error : new Error("Internal server error"),
      { durationMs: duration }
    );
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
