// Inspections API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getInspections, createInspection } from "@/lib/api/inspections";
import { checkRouteEntitlement, incrementEntitlementUsage } from "@/lib/entitlements/api-middleware";
import { z } from "zod";

const createSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  inspectionType: z.enum(["annual", "move_in", "move_out", "fire_safety", "elevator", "hvac", "roof", "pool", "emergency_systems", "insurance", "other"]),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  inspectorId: z.string().uuid().optional(),
  inspectorVendorId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const inspectionType = searchParams.get("inspectionType");
    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (inspectionType) filters.inspectionType = inspectionType;
    
    const result = await getInspections({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      propertyId: searchParams.get("propertyId") || undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
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
    const entitlementCheck = await checkRouteEntitlement(request, "inspections");
    if (!entitlementCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: entitlementCheck.error || "Feature not available",
        code: "NOT_ENTITLED"
      }, { status: 403 });
    }

    const body = await request.json();
    console.log("[Inspections API] Received body:", JSON.stringify(body, null, 2));
    
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Inspections API] Validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    console.log("[Inspections API] Creating with data:", validation.data, "userId:", user.id);
    const result = await createInspection(validation.data, user.id);
    console.log("[Inspections API] Result:", result);
    
    if (!result.success) {
      console.error("[Inspections API] Failed:", result.error);
      return NextResponse.json(result, { status: 400 });
    }

    // Increment usage if entitled
    if (entitlementCheck.tenantId) {
      try {
        await incrementEntitlementUsage(entitlementCheck.tenantId, "inspections");
      } catch (err) {
        console.error("Error incrementing entitlement usage:", err);
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
