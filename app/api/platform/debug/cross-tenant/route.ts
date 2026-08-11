// Platform Admin - Cross-Tenant Data Lookup API
// POST /api/platform/debug/cross-tenant
// Searches for data across all tenants

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const { searchEmail, searchEntityId } = await request.json();
    
    const serviceClient = createServiceClient();
    
    const results: any = {
      searchCriteria: { searchEmail, searchEntityId },
      tenants: [],
      contacts: [],
      entities: {},
    };

    // Search by email
    if (searchEmail) {
      const { data: contacts } = await serviceClient
        .from("contacts")
        .select("id, first_name, last_name, email, tenant_id, portal_user_id, portal_invitation_status")
        .ilike("email", `%${searchEmail}%`)
        .limit(20);
      
      results.contacts = contacts || [];
      
      // Get tenant info for found contacts
      const tenantIds = [...new Set((contacts || []).map((c: any) => c.tenant_id))];
      if (tenantIds.length > 0) {
        const { data: tenants } = await serviceClient
          .from("tenants")
          .select("id, name, code")
          .in("id", tenantIds);
        results.tenants = tenants || [];
      }
    }

    // Search by entity ID
    if (searchEntityId) {
      const entityTypes = [
        { table: "associations", name: "associations" },
        { table: "properties", name: "properties" },
        { table: "units", name: "units" },
        { table: "vendors", name: "vendors" },
        { table: "maintenance_requests", name: "maintenance" },
        { table: "inspections", name: "inspections" },
      ];

      for (const entity of entityTypes) {
        const { data, error } = await serviceClient
          .from(entity.table)
          .select("id, tenant_id, business_id, created_at")
          .or(`id.eq.${searchEntityId},${entity.name === 'associations' ? 'association_id' : entity.name === 'properties' ? 'property_id' : 'id'}.eq.${searchEntityId}`)
          .limit(5);
        
        if (data && data.length > 0) {
          results.entities[entity.name] = data;
        }
      }
    }

    // Get all tenants summary if no specific search
    if (!searchEmail && !searchEntityId) {
      const { data: allTenants } = await serviceClient
        .from("tenants")
        .select("id, name, code, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      
      results.allTenants = allTenants || [];
      
      // Get entity counts per tenant
      const tenantsWithCounts = [];
      for (const tenant of (allTenants || []).slice(0, 5)) {
        const [
          { count: assocCount },
          { count: contactCount },
        ] = await Promise.all([
          serviceClient.from("associations").select("id", { count: "exact" }).eq("tenant_id", tenant.id),
          serviceClient.from("contacts").select("id", { count: "exact" }).eq("tenant_id", tenant.id),
        ]);
        
        tenantsWithCounts.push({
          ...tenant,
          entityCounts: {
            associations: assocCount || 0,
            contacts: contactCount || 0,
          }
        });
      }
      results.allTenants = tenantsWithCounts;
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error("Cross-tenant debug error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
