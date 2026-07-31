// Documents API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDocuments, createDocument } from "@/lib/api/documents";
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
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const result = await getDocuments({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      search: searchParams.get("search") || undefined,
      associationId: searchParams.get("associationId") || undefined,
      propertyId: searchParams.get("propertyId") || undefined,
      filters: {
        documentType: searchParams.get("documentType") || undefined,
        status: searchParams.get("status") || undefined,
      },
    });

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await createDocument(validation.data, user.id);
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
