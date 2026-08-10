// Compliance API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getComplianceMatters, createComplianceMatter } from "@/lib/api/compliance";
import { checkRouteEntitlement, incrementEntitlementUsage } from "@/lib/entitlements/api-middleware";
import { z } from "zod";

const createSchema = z.object({
  associationId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(), // Allow any string, validation is flexible
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  identifiedDate: z.string().optional(),
  dueDate: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    
    const result = await getComplianceMatters({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      associationId: searchParams.get("associationId") || undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      businessId: user.businessId, // CRITICAL: Pass tenant ID for isolation
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
    const entitlementCheck = await checkRouteEntitlement(request, "compliance");
    if (!entitlementCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: entitlementCheck.error || "Feature not available",
        code: "NOT_ENTITLED"
      }, { status: 403 });
    }

    const body = await request.json();
    console.log("[Compliance API] Received body:", JSON.stringify(body, null, 2));

    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Compliance API] Validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    console.log("[Compliance API] Creating with data:", validation.data, "userId:", user.id);
    const result = await createComplianceMatter(validation.data, user.id);
    console.log("[Compliance API] Result:", result);

    if (!result.success) {
      console.error("[Compliance API] Failed:", result.error);
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
