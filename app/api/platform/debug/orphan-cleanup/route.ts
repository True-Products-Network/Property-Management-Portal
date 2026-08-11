// Platform Admin - Orphan Data Cleanup API
// POST /api/platform/debug/orphan-cleanup
// Finds and cleans up orphaned records

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = body.portalDomain || body.tenantId;
    const dryRun = body.dryRun !== false; // Default to true for safety
    
    // Check if input looks like a UUID (tenant ID)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidPattern.test(input);
    
    const serviceClient = createServiceClient();
    
    if (!input) {
      return NextResponse.json({ error: "Tenant ID or portal domain required" }, { status: 400 });
    }

    // Get tenant info
    let tenantQuery = serviceClient
      .from("tenants")
      .select("id, name, code");
    
    if (isUuid) {
      tenantQuery = tenantQuery.eq("id", input);
    } else {
      tenantQuery = tenantQuery.or(`code.ilike.%${input}%,name.ilike.%${input}%`);
    }
    
    const { data: tenant, error: tenantError } = await tenantQuery.single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const results: any = {
      dryRun,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
      },
      orphans: [],
      deleted: [],
    };

    // Define entity types to scan
    const entityTypes = [
      { table: "associations", name: "associations", hasTenantId: true },
      { table: "properties", name: "properties", hasTenantId: true },
      { table: "units", name: "units", hasTenantId: true },
      { table: "vendors", name: "vendors", hasTenantId: true },
      { table: "maintenance_requests", name: "maintenance_requests", hasTenantId: true },
      { table: "inspections", name: "inspections", hasTenantId: true },
      { table: "documents", name: "documents", hasTenantId: true },
      { table: "approvals", name: "approvals", hasTenantId: true },
      { table: "compliance_matters", name: "compliance_matters", hasTenantId: true },
      { table: "contacts", name: "contacts", hasTenantId: true },
    ];

    for (const entity of entityTypes) {
      // Find records with missing tenant_id for this tenant's data
      // Or records that reference non-existent tenants
      const { data: orphanedRecords, error } = await serviceClient
        .from(entity.table)
        .select("id, tenant_id, created_at")
        .eq("tenant_id", tenant.id)
        .is("business_id", null)
        .limit(100);

      if (orphanedRecords && orphanedRecords.length > 0) {
        for (const record of orphanedRecords) {
          results.orphans.push({
            table: entity.table,
            id: record.id,
            issue: "Missing business_id",
            created_at: record.created_at,
          });

          if (!dryRun) {
            // Actually delete the orphaned record
            const { error: deleteError } = await serviceClient
              .from(entity.table)
              .delete()
              .eq("id", record.id);

            if (!deleteError) {
              results.deleted.push({
                table: entity.table,
                id: record.id,
              });
            }
          }
        }
      }
    }

    // Also check for records with invalid tenant references
    const { data: allTenants } = await serviceClient
      .from("tenants")
      .select("id");
    
    const validTenantIds = new Set(allTenants?.map((t: any) => t.id) || []);

    for (const entity of entityTypes) {
      // This is a more expensive check - only run in dry-run mode or if explicitly requested
      if (dryRun) {
        const { data: recordsWithInvalidTenant, error } = await serviceClient
          .from(entity.table)
          .select("id, tenant_id, created_at")
          .limit(50);

        if (recordsWithInvalidTenant) {
          for (const record of recordsWithInvalidTenant) {
            if (record.tenant_id && !validTenantIds.has(record.tenant_id)) {
              results.orphans.push({
                table: entity.table,
                id: record.id,
                issue: `Invalid tenant_id: ${record.tenant_id}`,
                created_at: record.created_at,
              });
            }
          }
        }
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error("Orphan cleanup error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
