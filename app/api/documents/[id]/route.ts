// Document Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDocument, updateDocument, deleteDocument } from "@/lib/api/documents";
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
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await getDocument(id);

    if (!result.success) return NextResponse.json(result, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await updateDocument(id, validation.data, user.id);
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await deleteDocument(id);

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
