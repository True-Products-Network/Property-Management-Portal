// Property Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getProperty, updateProperty, deleteProperty } from "@/lib/api/properties";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";
import { z } from "zod";

const updateSchema = z.object({
  associationId: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  addressStreet: z.string().min(1).optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  yearBuilt: z.number().optional(),
  totalUnits: z.number().optional(),
  managementStartDate: z.string().optional(),
  accessInstructions: z.string().optional(),
  emergencyNotes: z.string().optional(),
  assignedStaffId: z.string().uuid().optional().nullable(),
  photoUrl: z.string().optional(),
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
      await auditLoggers.error(context, "PROPERTY_VIEW", "property", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    const result = await getProperty(id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "PROPERTY_VIEW", "property", new Error(result.error || "Property not found"), { propertyId: id, durationMs: duration });
      return NextResponse.json(result, { status: 404 });
    }

    await auditLoggers.view(context, "property", id, result.data?.name || "Unknown", { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "PROPERTY_VIEW", "property", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
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
      await auditLoggers.error(context, "PROPERTY_UPDATE", "property", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    const body = await request.json();
    console.log("[Properties API PUT] Received body:", JSON.stringify(body, null, 2));
    
    // Get existing property for before/after comparison
    const existingResult = await getProperty(id);
    const beforeValues = existingResult.success ? existingResult.data : undefined;

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Properties API PUT] Validation failed:", validation.error.flatten().fieldErrors);
      await auditLoggers.error(context, "PROPERTY_UPDATE", "property", new Error("Validation failed"), { propertyId: id, validationErrors: validation.error.flatten().fieldErrors });
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await updateProperty(id, validation.data, user.id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      console.error("[Properties API PUT] updateProperty failed:", result.error);
      await auditLoggers.error(context, "PROPERTY_UPDATE", "property", new Error(result.error || "Failed to update property"), { propertyId: id, data: validation.data, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    await auditLoggers.update(context, "property", id, validation.data.name || beforeValues?.name || "Unknown", beforeValues || {}, validation.data, { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "PROPERTY_UPDATE", "property", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
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
      await auditLoggers.error(context, "PROPERTY_DELETE", "property", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    
    // Get existing property for audit log
    const existingResult = await getProperty(id);
    const beforeValues = existingResult.success ? existingResult.data : undefined;

    const result = await deleteProperty(id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "PROPERTY_DELETE", "property", new Error(result.error || "Failed to delete property"), { propertyId: id, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    await auditLoggers.delete(context, "property", id, beforeValues?.name || "Unknown", beforeValues || {}, { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "PROPERTY_DELETE", "property", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
