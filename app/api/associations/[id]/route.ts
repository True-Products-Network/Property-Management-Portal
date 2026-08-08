// Association Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { getAssociation, updateAssociation, deleteAssociation } from "@/lib/api/associations";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  shortName: z.string().optional().nullable(),
  legalName: z.string().optional().nullable(),
  type: z.string().optional(),
  status: z.string().optional(),
  addressStreet: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressState: z.string().optional().nullable(),
  addressZip: z.string().optional().nullable(),
  mailingAddress: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  taxId: z.string().optional().nullable(),
  fiscalYear: z.string().optional().nullable(),
  fiscalYearEndMonth: z.string().optional().nullable(),
  fiscalYearEndDay: z.number().optional().nullable(),
  annualMeetingMonth: z.string().optional().nullable(),
  managementStartDate: z.string().optional().nullable(),
  assignedManagerId: z.string().uuid().optional().nullable(),
  financialPlatform: z.string().optional().nullable(),
  financialPortalLink: z.string().optional().nullable(),
  documentStorageLink: z.string().optional().nullable(),
  emergencyInstructions: z.string().optional().nullable(),
  generalNotes: z.string().optional().nullable(),
  propertyCount: z.number().optional().nullable(),
  unitCount: z.number().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_VIEW",
        "association",
        new Error("Unauthorized"),
        { path: request.nextUrl.pathname }
      );
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    const result = await getAssociation(id);
    console.log("[Associations API GET] Result:", JSON.stringify(result, null, 2));

    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_VIEW",
        "association",
        new Error(result.error || "Association not found"),
        { associationId: id, durationMs: duration }
      );
      return NextResponse.json(result, { status: 404 });
    }

    // Log successful view
    await auditLoggers.view(
      context,
      "association",
      id,
      result.data?.name || "Unknown",
      { durationMs: duration }
    );

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(
      context,
      "ASSOCIATION_VIEW",
      "association",
      error instanceof Error ? error : new Error("Internal server error"),
      { durationMs: duration }
    );
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_UPDATE",
        "association",
        new Error("Unauthorized"),
        { path: request.nextUrl.pathname }
      );
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    context.userId = user.id;
    context.tenantId = user.businessId;
    
    if (!isAdmin(user.roles)) {
      await auditLoggers.securityEvent(
        context,
        "ASSOCIATION_UPDATE_UNAUTHORIZED",
        "warning",
        { roles: user.roles }
      );
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    console.log("[Associations API PUT] Received body:", JSON.stringify(body, null, 2));

    // Get existing association for before/after comparison
    const existingResult = await getAssociation(id);
    const beforeValues = existingResult.success ? existingResult.data : undefined;

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Associations API PUT] Validation failed:", validation.error.flatten().fieldErrors);
      await auditLoggers.error(
        context,
        "ASSOCIATION_UPDATE",
        "association",
        new Error("Validation failed"),
        { associationId: id, validationErrors: validation.error.flatten().fieldErrors }
      );
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await updateAssociation({ ...validation.data, id }, user.id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_UPDATE",
        "association",
        new Error(result.error || "Failed to update association"),
        { associationId: id, data: validation.data, durationMs: duration }
      );
      return NextResponse.json(result, { status: 400 });
    }

    // Log successful update
    await auditLoggers.update(
      context,
      "association",
      id,
      validation.data.name || beforeValues?.name || "Unknown",
      beforeValues || {},
      validation.data,
      { durationMs: duration }
    );

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(
      context,
      "ASSOCIATION_UPDATE",
      "association",
      error instanceof Error ? error : new Error("Internal server error"),
      { durationMs: duration }
    );
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_DELETE",
        "association",
        new Error("Unauthorized"),
        { path: request.nextUrl.pathname }
      );
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    context.userId = user.id;
    context.tenantId = user.businessId;
    
    if (!isAdmin(user.roles)) {
      await auditLoggers.securityEvent(
        context,
        "ASSOCIATION_DELETE_UNAUTHORIZED",
        "warning",
        { roles: user.roles }
      );
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    
    // Get existing association for audit log
    const existingResult = await getAssociation(id);
    const beforeValues = existingResult.success ? existingResult.data : undefined;

    const result = await deleteAssociation(id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(
        context,
        "ASSOCIATION_DELETE",
        "association",
        new Error(result.error || "Failed to delete association"),
        { associationId: id, durationMs: duration }
      );
      return NextResponse.json(result, { status: 400 });
    }

    // Log successful deletion
    await auditLoggers.delete(
      context,
      "association",
      id,
      beforeValues?.name || "Unknown",
      beforeValues || {},
      { durationMs: duration }
    );

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(
      context,
      "ASSOCIATION_DELETE",
      "association",
      error instanceof Error ? error : new Error("Internal server error"),
      { durationMs: duration }
    );
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
