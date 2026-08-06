import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/auth/validate-tenant?slug=<tenant-id>
// Public endpoint to validate a tenant ID exists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Tenant slug is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Look up tenant by ID
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, name")
      .eq("id", slug)
      .maybeSingle();

    if (error) {
      console.error("[ValidateTenant] Error looking up tenant:", error);
      return NextResponse.json(
        { error: "Failed to validate tenant" },
        { status: 500 }
      );
    }

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
    });
  } catch (error) {
    console.error("[ValidateTenant] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
