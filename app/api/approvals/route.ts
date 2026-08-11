// Approvals API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getApprovals, createApproval } from "@/lib/api/approvals";
import { checkRouteEntitlement, incrementEntitlementUsage } from "@/lib/entitlements/api-middleware";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Dynamic validation - will fetch from dropdown_settings
async function getApprovalTypeValues(tenantId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dropdown_settings")
    .select("value")
    .eq("tenant_id", tenantId)
    .eq("record_type", "Approval")
    .eq("field_name", "Approval Type")
    .eq("is_active", true);
  
  // Return dynamic values or fallback to defaults
  return data?.map((d: { value: string }) => d.value) || [
    "maintenance", "capital_improvement", "vendor_contract", "budget_item", 
    "policy_change", "special_assessment", "vendor_selection", 
    "contract_approval", "capital_expense", "other"
  ];
}

const createSchema = (approvalTypes: string[]) => z.object({
  associationId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  approvalType: z.enum(approvalTypes as [string, ...string[]]).optional(),
  requestedAmount: z.number().optional(),
  maintenanceRequestId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const approvalType = searchParams.get("approvalType");
    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (approvalType) filters.approvalType = approvalType;
    
    const result = await getApprovals({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      associationId: searchParams.get("associationId") || undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      businessId: user.businessId,
      tenantId: user.tenantId, // CRITICAL: Pass tenant ID for isolation
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
    const entitlementCheck = await checkRouteEntitlement(request, "approvals");
    if (!entitlementCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: entitlementCheck.error || "Feature not available",
        code: "NOT_ENTITLED"
      }, { status: 403 });
    }

    const body = await request.json();
    console.log("[Approvals API] Received body:", JSON.stringify(body, null, 2));
    
    // Get dynamic approval types for this tenant
    const approvalTypes = await getApprovalTypeValues(entitlementCheck.tenantId || '');
    console.log("[Approvals API] Available approval types:", approvalTypes);
    
    const validation = createSchema(approvalTypes).safeParse(body);
    if (!validation.success) {
      console.error("[Approvals API] Validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    console.log("[Approvals API] Creating with data:", validation.data, "userId:", user.id);
    const result = await createApproval(validation.data, user.id);
    console.log("[Approvals API] Result:", result);
    
    if (!result.success) {
      console.error("[Approvals API] Failed:", result.error);
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
