// Document Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDocument, updateDocument, deleteDocument } from "@/lib/api/documents";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  documentType: z.enum(["insurance", "financial", "legal", "meeting_minutes", "contract", "inspection_report", "certificate", "policy", "notice", "other"]).optional(),
  category: z.string().optional(),
  status: z.enum(["active", "archived", "expired"]).optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  isConfidential: z.boolean().optional(),
  requiresAcknowledgment: z.boolean().optional(),
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
      await auditLoggers.error(context, "DOCUMENT_VIEW", "document", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    const result = await getDocument(id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "DOCUMENT_VIEW", "document", new Error(result.error || "Document not found"), { documentId: id, durationMs: duration });
      return NextResponse.json(result, { status: 404 });
    }

    await auditLoggers.view(context, "document", id, result.data?.title || "unknown", { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "DOCUMENT_VIEW", "document", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
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
      await auditLoggers.error(context, "DOCUMENT_UPDATE", "document", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      await auditLoggers.error(context, "DOCUMENT_UPDATE", "document", new Error("Validation failed"), { validationErrors: validation.error.flatten().fieldErrors });
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // Get existing document for before values
    const existingResult = await getDocument(id);
    const beforeValues = existingResult.success ? existingResult.data : undefined;

    const result = await updateDocument(id, validation.data, user.id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "DOCUMENT_UPDATE", "document", new Error(result.error || "Failed to update document"), { documentId: id, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    await auditLoggers.update(context, "document", id, result.data?.title || "unknown", beforeValues || {}, validation.data, { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "DOCUMENT_UPDATE", "document", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
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
      await auditLoggers.error(context, "DOCUMENT_DELETE", "document", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    context.userId = user.id;
    context.tenantId = user.businessId;

    const { id } = await params;
    
    // Get existing document for before values
    const existingResult = await getDocument(id);
    const beforeValues = existingResult.success ? existingResult.data : {};
    const documentName = existingResult.success ? existingResult.data?.title : "unknown";

    const result = await deleteDocument(id);
    const duration = Date.now() - startTime;

    if (!result.success) {
      await auditLoggers.error(context, "DOCUMENT_DELETE", "document", new Error(result.error || "Failed to delete document"), { documentId: id, durationMs: duration });
      return NextResponse.json(result, { status: 400 });
    }

    await auditLoggers.delete(context, "document", id, documentName || "unknown", beforeValues || {}, { durationMs: duration });
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    await auditLoggers.error(context, "DOCUMENT_DELETE", "document", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
