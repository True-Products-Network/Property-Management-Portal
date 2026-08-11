// Platform Admin - Orphan Data Cleanup API
// POST /api/platform/debug/orphan-cleanup
// Finds and optionally deletes orphaned records

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = body.portalDomain || body.tenantId;
    const dryRun = body.dryRun !== false; // Default to true for safety

    if (!input) {
      return NextResponse.json(
        { error: "Portal domain or tenant ID required" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Check if input looks like a UUID (tenant ID)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidPattern.test(input);

    // Get tenant info
    let tenantQuery = serviceClient.from("tenants").select("id, name, code");

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
      errors: [],
    };

    // Define entity types to check for orphans
    // Orphans are records with missing business_id or invalid tenant_id
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
      { table: "payment_records", name: "payment_records", hasTenantId: true },
      { table: "communications", name: "communications", hasTenantId: true },
      { table: "contacts", name: "contacts", hasTenantId: true, tenantColumn: "tenant_id" },
    ];

    for (const entity of entityTypes) {
      // Find records missing business_id for this tenant
      let missingBusinessQuery = serviceClient
        .from(entity.table)
        .select("id, created_at, updated_at")
        .is("business_id", null)
        .eq(entity.tenantColumn || "tenant_id", tenant.id);

      const { data: missingBusinessRecords, error: missingBusinessError } = await missingBusinessQuery;

      if (missingBusinessError) {
        results.errors.push({
          table: entity.table,
          error: missingBusinessError.message,
        });
        continue;
      }

      // Find records with null tenant_id (truly orphaned)
      let missingTenantQuery = serviceClient
        .from(entity.table)
        .select("id, created_at, updated_at")
        .is(entity.tenantColumn || "tenant_id", null);

      const { data: missingTenantRecords, error: missingTenantError } = await missingTenantQuery;

      if (missingTenantError) {
        results.errors.push({
          table: entity.table,
          error: missingTenantError.message,
        });
        continue;
      }

      // Add missing business_id records to orphans list
      if (missingBusinessRecords && missingBusinessRecords.length > 0) {
        for (const record of missingBusinessRecords) {
          results.orphans.push({
            table: entity.table,
            id: record.id,
            issue: "missing_business_id",
            created_at: record.created_at,
          });

          // Delete if not dry run
          if (!dryRun) {
            const { error: deleteError } = await serviceClient
              .from(entity.table)
              .delete()
              .eq("id", record.id);

            if (deleteError) {
              results.errors.push({
                table: entity.table,
                id: record.id,
                error: deleteError.message,
              });
            } else {
              results.deleted.push({
                table: entity.table,
                id: record.id,
                issue: "missing_business_id",
              });
            }
          }
        }
      }

      // Add missing tenant_id records to orphans list
      if (missingTenantRecords && missingTenantRecords.length > 0) {
        for (const record of missingTenantRecords) {
          results.orphans.push({
            table: entity.table,
            id: record.id,
            issue: "missing_tenant_id",
            created_at: record.created_at,
          });

          // Delete if not dry run
          if (!dryRun) {
            const { error: deleteError } = await serviceClient
              .from(entity.table)
              .delete()
              .eq("id", record.id);

            if (deleteError) {
              results.errors.push({
                table: entity.table,
                id: record.id,
                error: deleteError.message,
              });
            } else {
              results.deleted.push({
                table: entity.table,
                id: record.id,
                issue: "missing_tenant_id",
              });
            }
          }
        }
      }
    }

    // Check for orphaned dropdown_settings (no matching tenant)
    const { data: orphanedDropdowns } = await serviceClient
      .from("dropdown_settings")
      .select("id, tenant_id, record_type, field_name, value")
      .not("tenant_id", "in", serviceClient.from("tenants").select("id"));

    if (orphanedDropdowns && orphanedDropdowns.length > 0) {
      for (const record of orphanedDropdowns) {
        results.orphans.push({
          table: "dropdown_settings",
          id: record.id,
          issue: `orphaned_tenant_id: ${record.tenant_id}`,
          details: `${record.record_type}.${record.field_name} = ${record.value}`,
        });

        if (!dryRun) {
          const { error: deleteError } = await serviceClient
            .from("dropdown_settings")
            .delete()
            .eq("id", record.id);

          if (deleteError) {
            results.errors.push({
              table: "dropdown_settings",
              id: record.id,
              error: deleteError.message,
            });
          } else {
            results.deleted.push({
              table: "dropdown_settings",
              id: record.id,
              issue: "orphaned_tenant_id",
            });
          }
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Orphan cleanup error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
