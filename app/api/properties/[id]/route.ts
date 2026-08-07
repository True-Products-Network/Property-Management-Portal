// Property Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getProperty, updateProperty, deleteProperty } from "@/lib/api/properties";
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
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await getProperty(id);

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
    console.log("[Properties API PUT] Received body:", JSON.stringify(body, null, 2));
    
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Properties API PUT] Validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await updateProperty(id, validation.data, user.id);
    if (!result.success) {
      console.error("[Properties API PUT] updateProperty failed:", result.error);
      return NextResponse.json(result, { status: 400 });
    }
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
    const result = await deleteProperty(id);

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
