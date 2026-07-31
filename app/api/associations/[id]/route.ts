// Association Detail API Routes
// GET /api/associations/[id] - Get single association
// PUT /api/associations/[id] - Update association
// DELETE /api/associations/[id] - Delete association

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import {
  getAssociation,
  updateAssociation,
  deleteAssociation,
} from "@/lib/api/associations";
import { z } from "zod";

// Validation schema
const updateAssociationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  legalName: z.string().optional(),
  type: z.enum(["Condominium", "HOA", "Cooperative", "Commercial", "Other"]).optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().nullable(),
  fiscalYear: z.string().optional(),
  annualMeetingMonth: z.string().optional(),
  managementStartDate: z.string().optional().nullable(),
  assignedManagerId: z.string().uuid().optional().nullable(),
});

// GET /api/associations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get association
    const result = await getAssociation(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/associations/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/associations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Parse and validate body
    const body = await request.json();
    const validation = updateAssociationSchema.safeParse(body);

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

    // Update association
    const result = await updateAssociation(
      { ...validation.data, id },
      user.id
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PUT /api/associations/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/associations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Delete association
    const result = await deleteAssociation(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in DELETE /api/associations/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
