// Payments API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPayments, createPayment } from "@/lib/api/payments";
import { checkRouteEntitlement, incrementEntitlementUsage } from "@/lib/entitlements/api-middleware";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";
import { z } from "zod";

const createSchema = z.object({
  associationId: z.string().uuid(),
  contactId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  paymentType: z.enum(["assessment", "special_assessment", "late_fee", "fine", "vendor_payment", "deposit", "other"]).optional(),
  amount: z.number().positive(),
  processor: z.enum(["stripe", "paypal"]),
  paymentMethodType: z.enum(["card", "bank_transfer", "paypal"]).optional(),
  invoiceNumber: z.string().optional(),
  maintenanceRequestId: z.string().uuid().optional(),
  approvalId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(context, "PAYMENT_LIST", "payment", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentType = searchParams.get("paymentType");
    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (paymentType) filters.paymentType = paymentType;
    
    const result = await getPayments({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      associationId: searchParams.get("associationId") || undefined,
      contactId: searchParams.get("contactId") || undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      businessId: user.businessId, // CRITICAL: Pass tenant ID for isolation
    });

    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "PAYMENT_LIST", "payment", new Error(result.error || "Failed to fetch payments"), { durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "PAYMENT_LIST", "payment", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(context, "PAYMENT_CREATE", "payment", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    // Check entitlements
    const entitlementCheck = await checkRouteEntitlement(request, "payments");
    if (!entitlementCheck.allowed) {
      await auditLoggers.error(context, "PAYMENT_CREATE", "payment", new Error(entitlementCheck.error || "Feature not available"), { entitlementCheck });
      return NextResponse.json({ 
        success: false, 
        error: entitlementCheck.error || "Feature not available",
        code: "NOT_ENTITLED"
      }, { status: 403 });
    }

    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      await auditLoggers.error(context, "PAYMENT_CREATE", "payment", new Error("Validation failed"), { validationErrors: validation.error.flatten().fieldErrors });
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await createPayment(validation.data, user.id, user.businessId);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "PAYMENT_CREATE", "payment", new Error(result.error || "Failed to create payment"), { data: validation.data, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    // Increment usage if entitled
    if (entitlementCheck.tenantId) {
      try {
        await incrementEntitlementUsage(entitlementCheck.tenantId, "payments");
      } catch (err) {
        console.error("Error incrementing entitlement usage:", err);
      }
    }

    await auditLoggers.create(context, "payment", result.data?.id || "unknown", `Payment - ${validation.data.amount}`, validation.data, { durationMs: duration });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "PAYMENT_CREATE", "payment", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
