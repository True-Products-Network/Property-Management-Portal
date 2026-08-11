// Platform Admin - Session Diagnostics API
// POST /api/platform/debug/session
// Returns session info for a given portal domain/tenant

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const portalDomain = body.portalDomain || body.tenantId;
    const requestedTenantId = body.tenantId;
    
    const serviceClient = createServiceClient();
    
    // Find tenant by domain or ID
    let tenantQuery = serviceClient.from("tenants").select("id, name, code, status");
    
    if (requestedTenantId) {
      tenantQuery = tenantQuery.eq("id", requestedTenantId);
    } else if (portalDomain) {
      // Try to find by code or name
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

    // Get tenant users
    const { data: tenantUsers, error: usersError } = await serviceClient
      .from("tenant_users")
      .select("user_id, role, is_primary_admin, joined_at")
      .eq("tenant_id", tenant.id);

    // Get contacts for this tenant
    const { data: contacts, error: contactsError } = await serviceClient
      .from("contacts")
      .select("id, first_name, last_name, email, portal_user_id, portal_invitation_status")
      .eq("tenant_id", tenant.id)
      .limit(10);

    // Count entities
    const [
      { count: assocCount },
      { count: propCount },
      { count: unitCount },
      { count: vendorCount },
    ] = await Promise.all([
      serviceClient.from("associations").select("id", { count: "exact" }).eq("tenant_id", tenant.id),
      serviceClient.from("properties").select("id", { count: "exact" }).eq("tenant_id", tenant.id),
      serviceClient.from("units").select("id", { count: "exact" }).eq("tenant_id", tenant.id),
      serviceClient.from("vendors").select("id", { count: "exact" }).eq("tenant_id", tenant.id),
    ]);

    // Check for orphaned data
    const [
      { count: orphanedAssoc },
      { count: orphanedProp },
    ] = await Promise.all([
      serviceClient.from("associations").select("id", { count: "exact" }).is("business_id", null),
      serviceClient.from("properties").select("id", { count: "exact" }).is("business_id", null),
    ]);

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        status: tenant.status,
      },
      users: {
        count: tenantUsers?.length || 0,
        admins: tenantUsers?.filter((u: any) => u.role === "admin" || u.is_primary_admin).length || 0,
        data: tenantUsers?.slice(0, 5),
      },
      contacts: {
        count: contacts?.length || 0,
        withPortalAccess: contacts?.filter((c: any) => c.portal_user_id).length || 0,
        data: contacts,
      },
      entities: {
        associations: assocCount || 0,
        properties: propCount || 0,
        units: unitCount || 0,
        vendors: vendorCount || 0,
      },
      orphaned: {
        associations: orphanedAssoc || 0,
        properties: orphanedProp || 0,
      },
      errors: {
        tenant: tenantError ? (tenantError as any).message : null,
        users: usersError ? (usersError as any).message : null,
        contacts: contactsError ? (contactsError as any).message : null,
      }
    });

  } catch (error) {
    console.error("Session debug error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
