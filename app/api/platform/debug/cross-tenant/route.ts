// Platform Admin - Cross-Tenant Data Lookup API
// POST /api/platform/debug/cross-tenant
// Searches for data across all tenants

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchEmail, searchEntityId, portalDomain } = body;
    
    // Support portalDomain as search term
    const searchTerm = searchEmail || searchEntityId || portalDomain;
    
    const serviceClient = createServiceClient();
    
    const results: any = {
      searchTerm,
      results: [],
      totalCount: 0,
    };

    // Search by email/term in contacts
    if (searchTerm) {
      // Search contacts by email
      const { data: contacts } = await serviceClient
        .from("contacts")
        .select("id, first_name, last_name, email, tenant_id, portal_user_id")
        .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .limit(20);
      
      if (contacts && contacts.length > 0) {
        // Get tenant info for found contacts
        const tenantIds = [...new Set(contacts.map((c: any) => c.tenant_id))];
        const { data: tenants } = await serviceClient
          .from("tenants")
          .select("id, name, code")
          .in("id", tenantIds);
        
        const tenantMap = new Map(tenants?.map((t: any) => [t.id, t]) || []);
        
        for (const contact of contacts) {
          results.results.push({
            tenant_id: contact.tenant_id,
            tenant_name: tenantMap.get(contact.tenant_id)?.name || "Unknown",
            entity_type: "contact",
            entity_id: contact.id,
            entity_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || contact.email,
            match_field: contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ? "email" : "name",
            match_value: contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ? contact.email : `${contact.first_name} ${contact.last_name}`,
          });
        }
      }

      // Search associations
      const { data: associations } = await serviceClient
        .from("associations")
        .select("id, name, tenant_id, association_id")
        .or(`name.ilike.%${searchTerm}%,association_id.ilike.%${searchTerm}%`)
        .limit(10);
      
      if (associations && associations.length > 0) {
        const tenantIds = [...new Set(associations.map((a: any) => a.tenant_id))];
        const { data: tenants } = await serviceClient
          .from("tenants")
          .select("id, name")
          .in("id", tenantIds);
        
        const tenantMap = new Map(tenants?.map((t: any) => [t.id, t]) || []);
        
        for (const assoc of associations) {
          results.results.push({
            tenant_id: assoc.tenant_id,
            tenant_name: tenantMap.get(assoc.tenant_id)?.name || "Unknown",
            entity_type: "association",
            entity_id: assoc.id,
            entity_name: assoc.name,
            match_field: assoc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ? "name" : "association_id",
            match_value: assoc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ? assoc.name : assoc.association_id,
          });
        }
      }

      // Search tenants
      const { data: tenantMatches } = await serviceClient
        .from("tenants")
        .select("id, name, code")
        .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
        .limit(10);
      
      if (tenantMatches && tenantMatches.length > 0) {
        for (const tenant of tenantMatches) {
          results.results.push({
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            entity_type: "tenant",
            entity_id: tenant.id,
            entity_name: tenant.name,
            match_field: tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ? "name" : "code",
            match_value: tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ? tenant.name : tenant.code,
          });
        }
      }
    }

    results.totalCount = results.results.length;

    return NextResponse.json(results);

  } catch (error) {
    console.error("Cross-tenant debug error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
