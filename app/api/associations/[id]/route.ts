// Association Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { getAssociation, updateAssociation, deleteAssociation } from "@/lib/api/associations";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  shortName: z.string().optional(),
  legalName: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  mailingAddress: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  taxId: z.string().optional(),
  fiscalYear: z.string().optional(),
  fiscalYearEndMonth: z.string().optional(),
  fiscalYearEndDay: z.number().optional(),
  annualMeetingMonth: z.string().optional(),
  managementStartDate: z.string().optional(),
  assignedManagerId: z.string().uuid().optional(),
  financialPlatform: z.string().optional(),
  financialPortalLink: z.string().optional(),
  documentStorageLink: z.string().optional(),
  emergencyInstructions: z.string().optional(),
  generalNotes: z.string().optional(),
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
