// Associations API Routes
// GET /api/associations - List associations
// POST /api/associations - Create association

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import {
  getAssociations,
  createAssociation,
} from "@/lib/api/associations";
import { z } from "zod";

// Validation schema
const createAssociationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  legalName: z.string().optional(),
  type: z.enum(["Condominium", "HOA", "Cooperative", "Commercial", "Other"]),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  fiscalYear: z.string().optional(),
  annualMeetingMonth: z.string().optional(),
  managementStartDate: z.string().optional(),
  assignedManagerId: z.string().uuid().optional(),
});

// GET /api/associations
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Get associations
    const result = await getAssociations({
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      filters: status ? { status } : undefined,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/associations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST /api/associations
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin permission
    if (!isAdmin(user.roles)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = createAssociationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Create association
    const result = await createAssociation(validation.data, user.id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/associations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
