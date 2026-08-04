// Maintenance Requests API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMaintenanceRequests, createMaintenanceRequest } from "@/lib/api/maintenance";
import { checkRouteEntitlement, incrementEntitlementUsage } from "@/lib/entitlements/api-middleware";
import { z } from "zod";

const createSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  reportedByContactId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["HVAC", "Plumbing", "Electrical", "Appliance", "Structural", "Cosmetic", "Safety", "Cleaning", "Landscaping", "Other"]).optional(),
  urgency: z.enum(["emergency", "urgent", "normal", "low"]).optional(),
  requestedDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const result = await getMaintenanceRequests({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      search: searchParams.get("search") || undefined,
      propertyId: searchParams.get("propertyId") || undefined,
      unitId: searchParams.get("unitId") || undefined,
      status: searchParams.get("status") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      reportedBy: searchParams.get("reportedBy") || undefined,
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

    // Check entitlements
    const entitlementCheck = await checkRouteEntitlement(request, "maintenance_requests");
    if (!entitlementCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: entitlementCheck.error || "Feature not available",
        code: "NOT_ENTITLED"
      }, { status: 403 });
    }

    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await createMaintenanceRequest(validation.data, user.id);
    if (!result.success) return NextResponse.json(result, { status: 400 });

    // Increment usage if entitled
    if (entitlementCheck.tenantId) {
      try {
        await incrementEntitlementUsage(entitlementCheck.tenantId, "maintenance_requests");
      } catch (err) {
        console.error("Error incrementing entitlement usage:", err);
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
