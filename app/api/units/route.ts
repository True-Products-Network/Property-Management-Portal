// Units API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUnits, createUnit } from "@/lib/api/units";
import { z } from "zod";

const createSchema = z.object({
  propertyId: z.string().uuid(),
  unitNumber: z.string().min(1),
  displayName: z.string().optional(),
  type: z.enum(["Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom", "4+ Bedroom", "Penthouse", "Loft", "Townhouse"]).optional(),
  status: z.string().optional(),
  squareFeet: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  floor: z.string().optional(),
  parkingSpot: z.string().optional(),
  storageUnit: z.string().optional(),
  mailingAddress: z.string().optional(),
  accessNotes: z.string().optional(),
  occupancyStatus: z.string().optional(),
  rentalStatus: z.string().optional(),
  moveInDate: z.string().optional(),
  moveOutDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const result = await getUnits({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      search: searchParams.get("search") || undefined,
      propertyId: searchParams.get("propertyId") || undefined,
      filters: status ? { status } : undefined,
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
    console.log("[Units API] Received body:", JSON.stringify(body, null, 2));
    
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Units API] Validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    console.log("[Units API] Creating unit with data:", validation.data, "userId:", user.id);
    const result = await createUnit(validation.data, user.id);
    console.log("[Units API] createUnit result:", result);
    
    if (!result.success) {
      console.error("[Units API] createUnit failed:", result.error);
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[Units API] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
