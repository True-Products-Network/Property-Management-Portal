// Properties API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getProperties, createProperty } from "@/lib/api/properties";
import { checkRouteEntityLimit } from "@/lib/entitlements/entity-limits";
import { z } from "zod";

const createSchema = z.object({
  associationId: z.string().uuid(),
  name: z.string().min(1),
  addressStreet: z.string().min(1),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  type: z.enum(["Condominium", "Apartment", "Townhouse", "Single Family", "Commercial", "Mixed Use"]),
  yearBuilt: z.number().optional(),
  managementStartDate: z.string().optional(),
  accessInstructions: z.string().optional(),
  emergencyNotes: z.string().optional(),
  assignedStaffId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const result = await getProperties({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      search: searchParams.get("search") || undefined,
      associationId: searchParams.get("associationId") || undefined,
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

    // Check entity limits
    const limitCheck = await checkRouteEntityLimit(request, "properties");
    if (!limitCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: limitCheck.error || "Property limit reached",
        code: "LIMIT_REACHED",
        current: limitCheck.remaining !== undefined ? limitCheck.remaining + 1 : undefined,
        limit: limitCheck.remaining !== undefined ? limitCheck.remaining : undefined,
      }, { status: 403 });
    }

    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await createProperty(validation.data, user.id);
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
