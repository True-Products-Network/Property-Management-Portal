// Vendor Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getVendor, updateVendor, deleteVendor } from "@/lib/api/vendors";
import { z } from "zod";

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  doingBusinessAs: z.string().optional(),
  category: z.enum(["HVAC", "Plumbing", "Electrical", "Landscaping", "Cleaning", "Security", "Pest Control", "Roofing", "Painting", "General Contracting", "Elevator", "Fire Safety", "Pool Service", "Snow Removal", "Other"]).optional(),
  primaryContactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  emergencyPhone: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  licenseNumber: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  workersCompExpiry: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await getVendor(id);

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

    const result = await updateVendor(id, validation.data, user.id);
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
    const result = await deleteVendor(id);

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
