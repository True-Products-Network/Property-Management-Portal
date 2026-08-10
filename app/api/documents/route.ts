// Documents API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDocuments, createDocument } from "@/lib/api/documents";
import { checkRouteEntitlement, incrementEntitlementUsage } from "@/lib/entitlements/api-middleware";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.number().optional(),
  contentType: z.string().optional(),
  documentType: z.enum(["insurance", "financial", "legal", "meeting_minutes", "contract", "inspection_report", "certificate", "policy", "notice", "other"]).optional(),
  category: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  associationId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  maintenanceRequestId: z.string().uuid().optional(),
  inspectionId: z.string().uuid().optional(),
  isConfidential: z.boolean().optional(),
  requiresAcknowledgment: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(context, "DOCUMENT_LIST", "document", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get("documentType");
    const status = searchParams.get("status");
    const filters: Record<string, string> = {};
    if (documentType) filters.documentType = documentType;
    if (status) filters.status = status;
    
    const result = await getDocuments({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      search: searchParams.get("search") || undefined,
      associationId: searchParams.get("associationId") || undefined,
      propertyId: searchParams.get("propertyId") || undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      businessId: user.businessId, // CRITICAL: Pass tenant ID for isolation
    });

    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "DOCUMENT_LIST", "document", new Error(result.error || "Failed to fetch documents"), { durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "DOCUMENT_LIST", "document", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const user = await getSession();
    if (!user) {
      await auditLoggers.error(context, "DOCUMENT_CREATE", "document", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    // Check entitlements
    const entitlementCheck = await checkRouteEntitlement(request, "documents");
    if (!entitlementCheck.allowed) {
      await auditLoggers.error(context, "DOCUMENT_CREATE", "document", new Error(entitlementCheck.error || "Feature not available"), { entitlementCheck });
      return NextResponse.json({ 
        success: false, 
        error: entitlementCheck.error || "Feature not available",
        code: "NOT_ENTITLED"
      }, { status: 403 });
    }

    const body = await request.json();
    console.log("[Documents API] Received body:", JSON.stringify(body, null, 2));
    
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Documents API] Validation failed:", validation.error.flatten().fieldErrors);
      await auditLoggers.error(context, "DOCUMENT_CREATE", "document", new Error("Validation failed"), { validationErrors: validation.error.flatten().fieldErrors });
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    console.log("[Documents API] Creating with data:", validation.data, "userId:", user.id);
    const result = await createDocument(validation.data, user.id);
    console.log("[Documents API] Result:", result);
    const duration = Date.now() - startTime;
    
    if (!result.success) {
      console.error("[Documents API] Failed:", result.error);
      await auditLoggers.error(context, "DOCUMENT_CREATE", "document", new Error(result.error || "Failed to create document"), { data: validation.data, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    await auditLoggers.create(context, "document", result.data?.id || "unknown", validation.data.title, validation.data, { durationMs: duration });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "DOCUMENT_CREATE", "document", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
