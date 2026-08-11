// Platform Admin - Orphaned Data Scanner API
// POST /api/platform/debug/orphaned
// Finds entities with missing business_id or tenant_id

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filterTenantId = body.tenantId || body.portalDomain;
    
    const serviceClient = createServiceClient();
    
    const results: any = {
      scanTime: new Date().toISOString(),
      summary: {},
      details: {},
    };

    // Define entity types to scan
    const entityTypes = [
      { table: "associations", name: "associations", hasTenantId: true },
      { table: "properties", name: "properties", hasTenantId: true },
      { table: "units", name: "units", hasTenantId: true },
      { table: "vendors", name: "vendors", hasTenantId: true },
      { table: "maintenance_requests", name: "maintenance", hasTenantId: true },
      { table: "inspections", name: "inspections", hasTenantId: true },
      { table: "documents", name: "documents", hasTenantId: true },
      { table: "approvals", name: "approvals", hasTenantId: true },
      { table: "compliance_matters", name: "compliance", hasTenantId: true },
      { table: "payment_records", name: "payments", hasTenantId: true },
      { table: "communications", name: "communications", hasTenantId: true },
      { table: "contacts", name: "contacts", hasTenantId: true, tenantColumn: "tenant_id" },
    ];

    for (const entity of entityTypes) {
      let missingBusinessIdQuery = serviceClient
        .from(entity.table)
        .select("id", { count: "exact" })
        .is("business_id", null);
      
      if (filterTenantId && entity.hasTenantId) {
        missingBusinessIdQuery = missingBusinessIdQuery.eq(entity.tenantColumn || "tenant_id", filterTenantId);
      }

      const { count: missingBusinessId } = await missingBusinessIdQuery;

      let missingTenantIdQuery = serviceClient
        .from(entity.table)
        .select("id", { count: "exact" })
        .is(entity.tenantColumn || "tenant_id", null);

      const { count: missingTenantId } = await missingTenantIdQuery;

      // Get sample records
      let sampleQuery = serviceClient
        .from(entity.table)
        .select("id, created_at")
        .is("business_id", null)
        .limit(3);
      
      if (filterTenantId && entity.hasTenantId) {
        sampleQuery = sampleQuery.eq(entity.tenantColumn || "tenant_id", filterTenantId);
      }

      const { data: samples } = await sampleQuery;

      results.summary[entity.name] = {
        missingBusinessId: missingBusinessId || 0,
        missingTenantId: missingTenantId || 0,
        sampleIds: samples?.map((s: any) => s.id) || [],
      };

      results.details[entity.name] = {
        totalOrphaned: (missingBusinessId || 0) + (missingTenantId || 0),
        samples: samples || [],
      };
    }

    // Calculate totals
    results.summary.totalOrphaned = Object.values(results.summary).reduce(
      (sum: number, entity: any) => sum + (entity.missingBusinessId || 0) + (entity.missingTenantId || 0),
      0
    );

    return NextResponse.json(results);

  } catch (error) {
    console.error("Orphaned data scan error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
