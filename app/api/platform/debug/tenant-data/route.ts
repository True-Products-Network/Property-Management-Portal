// Platform Admin - Tenant Data Overview API
// POST /api/platform/debug/tenant-data
// Returns all data counts for a specific tenant

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const portalDomain = body.portalDomain || body.tenantId;
    const requestedTenantId = body.tenantId || body.portalDomain;
    
    const serviceClient = createServiceClient();
    
    // Find tenant
    let tenantQuery = serviceClient.from("tenants").select("id, name, code, status, created_at");
    
    if (requestedTenantId) {
      tenantQuery = tenantQuery.eq("id", requestedTenantId);
    } else if (portalDomain) {
      tenantQuery = tenantQuery.or(`code.ilike.%${portalDomain}%,name.ilike.%${portalDomain}%`);
    } else {
      return NextResponse.json({ error: "Portal domain or tenant ID required" }, { status: 400 });
    }
    
    const { data: tenant, error: tenantError } = await tenantQuery.maybeSingle();
    
    if (tenantError || !tenant) {
      return NextResponse.json({ 
        error: "Tenant not found",
        searched: portalDomain || requestedTenantId 
      }, { status: 404 });
    }

    const tenantId = tenant.id;

    // Get counts for all entity types
    const [
      { count: associations },
      { count: properties },
      { count: units },
      { count: contacts },
      { count: vendors },
      { count: maintenance },
      { count: inspections },
      { count: documents },
      { count: approvals },
      { count: compliance },
      { count: payments },
      { count: communications },
    ] = await Promise.all([
      serviceClient.from("associations").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("properties").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("units").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("contacts").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("vendors").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("maintenance_requests").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("inspections").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("documents").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("approvals").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("compliance_matters").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("payment_records").select("id", { count: "exact" }).eq("tenant_id", tenantId),
      serviceClient.from("communications").select("id", { count: "exact" }).eq("tenant_id", tenantId),
    ]);

    // Get recent activity
    const { data: recentAssociations } = await serviceClient
      .from("associations")
      .select("id, name, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        status: tenant.status,
        createdAt: tenant.created_at,
      },
      counts: {
        associations: associations || 0,
        properties: properties || 0,
        units: units || 0,
        contacts: contacts || 0,
        vendors: vendors || 0,
        maintenance: maintenance || 0,
        inspections: inspections || 0,
        documents: documents || 0,
        approvals: approvals || 0,
        compliance: compliance || 0,
        payments: payments || 0,
        communications: communications || 0,
        total: (associations || 0) + (properties || 0) + (units || 0) + (contacts || 0) +
               (vendors || 0) + (maintenance || 0) + (inspections || 0) + (documents || 0) +
               (approvals || 0) + (compliance || 0) + (payments || 0) + (communications || 0),
      },
      recent: {
        associations: recentAssociations,
      },
    });

  } catch (error) {
    console.error("Tenant data debug error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
