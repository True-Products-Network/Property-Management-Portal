// Platform Admin - Seed Tenant Data API
// POST /api/platform/tenants/[id]/seed
// Seeds core default data for a tenant

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { seedTenantData } from "@/lib/platform/tenant-seed";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const body = await request.json();
    const { categories } = body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: "No categories selected for seeding" },
        { status: 400 }
      );
    }

    const result = await seedTenantData(tenantId, categories);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error seeding tenant data:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
