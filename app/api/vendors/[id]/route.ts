// Vendor Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getVendor, updateVendor, deleteVendor } from "@/lib/api/vendors";
import { z } from "zod";

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  doingBusinessAs: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
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
    console.log("[Vendor PUT] Request body:", JSON.stringify(body, null, 2));
    
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      console.error("[Vendor PUT] Validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    console.log("[Vendor PUT] Validation passed, calling updateVendor");
    const result = await updateVendor(id, validation.data, user.id);
    console.log("[Vendor PUT] updateVendor result:", result);
    
    if (!result.success) {
      console.error("[Vendor PUT] updateVendor failed:", result.error);
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
    const result = await deleteVendor(id);

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
