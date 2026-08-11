// Platform Admin - Business Record Fix API
// POST /api/platform/debug/business-fix
// Creates business records and links orphaned data

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const { tenantId: requestedTenantId, dryRun = true } = await request.json();
    
    const serviceClient = createServiceClient();
    
    if (!requestedTenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // Get tenant info
    const { data: tenant, error: tenantError } = await serviceClient
      .from("tenants")
      .select("id, name, code")
      .eq("id", requestedTenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const results: any = {
      dryRun,
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      business: null,
      migrations: {},
    };

    // Check if business already exists
    const { data: existingBusiness } = await serviceClient
      .from("businesses")
      .select("id, name")
      .eq("slug", tenant.id)
      .maybeSingle();

    let businessId: string;

    if (existingBusiness) {
      results.business = {
        id: existingBusiness.id,
        name: existingBusiness.name,
        status: "existing",
      };
      businessId = existingBusiness.id;
    } else if (!dryRun) {
      // Create business record
      const { data: newBusiness, error: createError } = await serviceClient
        .from("businesses")
        .insert({
          name: tenant.name,
          slug: tenant.id,
          status: "active",
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ 
          error: "Failed to create business: " + createError.message 
        }, { status: 500 });
      }

      results.business = {
        id: newBusiness.id,
        name: newBusiness.name,
        status: "created",
      };
      businessId = newBusiness.id;
    } else {
      results.business = {
        status: "would_create",
        name: tenant.name,
        slug: tenant.id,
      };
      businessId = "dry-run-business-id";
    }

    // Define entity types to migrate
    const entityTypes = [
      { table: "associations", name: "associations" },
      { table: "properties", name: "properties" },
      { table: "units", name: "units" },
      { table: "vendors", name: "vendors" },
      { table: "maintenance_requests", name: "maintenance" },
      { table: "inspections", name: "inspections" },
      { table: "documents", name: "documents" },
      { table: "approvals", name: "approvals" },
      { table: "compliance_matters", name: "compliance" },
      { table: "payment_records", name: "payments" },
      { table: "communications", name: "communications" },
    ];

    for (const entity of entityTypes) {
      // Count orphaned records
      const { count: orphanedCount } = await serviceClient
        .from(entity.table)
        .select("id", { count: "exact" })
        .is("business_id", null)
        .eq("tenant_id", tenant.id);

      if (!dryRun && orphanedCount && orphanedCount > 0) {
        // Actually migrate the data
        const { data: migrated, error: migrateError } = await serviceClient
          .from(entity.table)
          .update({ 
            business_id: businessId,
            updated_at: new Date().toISOString(),
          })
          .is("business_id", null)
          .eq("tenant_id", tenant.id)
          .select("id");

        results.migrations[entity.name] = {
          found: orphanedCount || 0,
          migrated: migrated?.length || 0,
          error: migrateError?.message,
          status: migrateError ? "error" : "success",
        };
      } else {
        results.migrations[entity.name] = {
          found: orphanedCount || 0,
          migrated: 0,
          status: dryRun ? "would_migrate" : "no_action",
        };
      }
    }

    // Also update contacts (they use tenant_id already, just add business_id)
    const { count: orphanedContacts } = await serviceClient
      .from("contacts")
      .select("id", { count: "exact" })
      .is("business_id", null)
      .eq("tenant_id", tenant.id);

    if (!dryRun && orphanedContacts && orphanedContacts > 0) {
      const { data: migratedContacts, error: contactError } = await serviceClient
        .from("contacts")
        .update({ business_id: businessId })
        .is("business_id", null)
        .eq("tenant_id", tenant.id)
        .select("id");

      results.migrations.contacts = {
        found: orphanedContacts || 0,
        migrated: migratedContacts?.length || 0,
        error: contactError?.message,
        status: contactError ? "error" : "success",
      };
    } else {
      results.migrations.contacts = {
        found: orphanedContacts || 0,
        migrated: 0,
        status: dryRun ? "would_migrate" : "no_action",
      };
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error("Business fix error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
