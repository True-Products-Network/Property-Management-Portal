// Inspection Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getInspection, updateInspection, deleteInspection } from "@/lib/api/inspections";
import { z } from "zod";

const updateSchema = z.object({
  inspectionType: z.enum(["annual", "move_in", "move_out", "fire_safety", "elevator", "hvac", "roof", "pool", "emergency_systems", "insurance", "other"]).optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "overdue", "cancelled", "rescheduled"]).optional(),
  completedDate: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  overallRating: z.enum(["excellent", "good", "fair", "poor", "critical"]).optional(),
  followUpRequired: z.boolean().optional(),
  followUpMaintenanceId: z.string().uuid().optional(),
  inspectorId: z.string().uuid().optional(),
  inspectorVendorId: z.string().uuid().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await getInspection(id);

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

    const result = await updateInspection(id, validation.data, user.id);
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
    const result = await deleteInspection(id);

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
