// Payment Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPayment, updatePaymentStatus, deletePayment } from "@/lib/api/payments";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "failed", "refunded", "disputed"]),
  processorTransactionId: z.string().optional(),
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
      await auditLoggers.error(context, "PAYMENT_VIEW", "payment", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    const result = await getPayment(id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "PAYMENT_VIEW", "payment", new Error(result.error || "Payment not found"), { paymentId: id, durationMs: duration });
      return NextResponse.json(result, { status: 404 });
    }

    await auditLoggers.view(context, "payment", id, `Payment - ${result.data?.amount || "unknown"}`, { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "PAYMENT_VIEW", "payment", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
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
      await auditLoggers.error(context, "PAYMENT_UPDATE", "payment", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      await auditLoggers.error(context, "PAYMENT_UPDATE", "payment", new Error("Validation failed"), { validationErrors: validation.error.flatten().fieldErrors });
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // Get existing payment for before values
    const existingResult = await getPayment(id);
    const beforeValues = existingResult.success ? existingResult.data || {} : {};

    const result = await updatePaymentStatus(id, validation.data.status, validation.data.processorTransactionId);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "PAYMENT_UPDATE", "payment", new Error(result.error || "Failed to update payment"), { paymentId: id, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    await auditLoggers.update(context, "payment", id, `Payment - ${result.data?.amount || "unknown"}`, beforeValues, validation.data, { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "PAYMENT_UPDATE", "payment", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
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
      await auditLoggers.error(context, "PAYMENT_DELETE", "payment", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    
    // Get existing payment for before values
    const existingResult = await getPayment(id);
    const beforeValues = existingResult.success ? existingResult.data || {} : {};
    const paymentName = `Payment - ${existingResult.success ? existingResult.data?.amount : "unknown"}`;

    const result = await deletePayment(id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "PAYMENT_DELETE", "payment", new Error(result.error || "Failed to delete payment"), { paymentId: id, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    await auditLoggers.delete(context, "payment", id, paymentName, beforeValues, { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "PAYMENT_DELETE", "payment", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
