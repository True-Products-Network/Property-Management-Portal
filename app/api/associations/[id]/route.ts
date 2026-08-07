// Association Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { getAssociation, updateAssociation, deleteAssociation } from "@/lib/api/associations";
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
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await getAssociation(id);

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
    if (!isAdmin(user.roles)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    console.log("[Associations API PUT] Received body:", JSON.stringify(body, null, 2));

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Associations API PUT] Validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await updateAssociation({ ...validation.data, id }, user.id);
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
    if (!isAdmin(user.roles)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const result = await deleteAssociation(id);

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
