// Maintenance Request Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest } from "@/lib/api/maintenance";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(), // Allow any string, validation is case-insensitive
  urgency: z.enum(["emergency", "urgent", "normal", "low"]).optional(),
  status: z.enum(["new", "triaged", "pending_approval", "approved", "vendor_assigned", "scheduled", "in_progress", "on_hold", "completed", "closed", "cancelled"]).optional(),
  assignedVendorId: z.string().uuid().optional(),
  assignedStaffId: z.string().uuid().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  vendorNotes: z.string().optional(),
  resolutionNotes: z.string().optional(),
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
      await auditLoggers.error(context, "MAINTENANCE_VIEW", "maintenance_request", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    const result = await getMaintenanceRequest(id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "MAINTENANCE_VIEW", "maintenance_request", new Error(result.error || "Maintenance request not found"), { maintenanceId: id, durationMs: duration });
      return NextResponse.json(result, { status: 404 });
    }

    await auditLoggers.view(context, "maintenance_request", id, result.data?.title || "Unknown", { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "MAINTENANCE_VIEW", "maintenance_request", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
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
      await auditLoggers.error(context, "MAINTENANCE_UPDATE", "maintenance_request", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    const body = await request.json();

    // Get existing maintenance request for before/after comparison
    const existingResult = await getMaintenanceRequest(id);
    const beforeValues = existingResult.success ? existingResult.data : undefined;

    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      await auditLoggers.error(context, "MAINTENANCE_UPDATE", "maintenance_request", new Error("Validation failed"), { maintenanceId: id, validationErrors: validation.error.flatten().fieldErrors });
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await updateMaintenanceRequest(id, validation.data, user.id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "MAINTENANCE_UPDATE", "maintenance_request", new Error(result.error || "Failed to update maintenance request"), { maintenanceId: id, data: validation.data, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    await auditLoggers.update(context, "maintenance_request", id, validation.data.title || beforeValues?.title || "Unknown", beforeValues || {}, validation.data, { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "MAINTENANCE_UPDATE", "maintenance_request", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
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
      await auditLoggers.error(context, "MAINTENANCE_DELETE", "maintenance_request", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;

    // Get existing maintenance request for audit log
    const existingResult = await getMaintenanceRequest(id);
    const beforeValues = existingResult.success ? existingResult.data : undefined;

    const result = await deleteMaintenanceRequest(id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "MAINTENANCE_DELETE", "maintenance_request", new Error(result.error || "Failed to delete maintenance request"), { maintenanceId: id, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    await auditLoggers.delete(context, "maintenance_request", id, beforeValues?.title || "Unknown", beforeValues || {}, { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "MAINTENANCE_DELETE", "maintenance_request", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
