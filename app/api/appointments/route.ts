// Appointments API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAppointments, createAppointment } from "@/lib/api/appointments";
import { z } from "zod";

const createSchema = z.object({
  associationId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  appointmentType: z.enum(["maintenance", "inspection", "meeting", "showing", "vendor_visit", "other"]).optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  isVirtual: z.boolean().optional(),
  virtualLink: z.string().optional(),
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  maintenanceRequestId: z.string().uuid().optional(),
  inspectionId: z.string().uuid().optional(),
  participantIds: z.array(z.string().uuid()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const result = await getAppointments({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      associationId: searchParams.get("associationId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
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
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await createAppointment(validation.data, user.id);
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
