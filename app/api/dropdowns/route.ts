// Public Dropdown Values API
// Returns dropdown values for specific record types and fields
// Requires authentication to get tenant-specific values

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDropdownValuesForTenant } from "@/lib/api/dropdowns";

// GET /api/dropdowns?recordType=contact&fieldName=role
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get("recordType");
    const fieldName = searchParams.get("fieldName");

    if (!recordType || !fieldName) {
      return NextResponse.json(
        { success: false, error: "recordType and fieldName are required" },
        { status: 400 }
      );
    }

    // Get current user and tenant
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant_id from user metadata or tenant_users table
    let tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();
      tenantId = tenantUser?.tenant_id;
    }

    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant found" }, { status: 400 });
    }

    const result = await getDropdownValuesForTenant(recordType, fieldName, tenantId);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // Return simplified format for dropdown consumption
    const simplified = result.data?.map((item) => ({
      value: item.value,
      label: item.label,
    }));

    return NextResponse.json({ success: true, data: simplified });
  } catch (error) {
    console.error("Error in GET /api/dropdowns:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
