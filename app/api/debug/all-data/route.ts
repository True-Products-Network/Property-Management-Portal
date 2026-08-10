// Debug API to see all data across all tenants
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json({ 
        error: "Not authenticated",
        authError: authError?.message 
      }, { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Get all tenants
    const { data: allTenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    // Get associations across all tenants
    const { data: allAssociations, error: assocError } = await supabase
      .from("associations")
      .select("id, name, business_id, tenant_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    // Get properties across all tenants
    const { data: allProperties, error: propError } = await supabase
      .from("properties")
      .select("id, name, business_id, association_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    // Get contacts across all tenants
    const { data: allContacts, error: contactError } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email, tenant_id, portal_user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    // Find which tenant has data
    const tenantDataMap = new Map<string, { tenant: any; associations: any[]; properties: any[]; contacts: any[] }>();
    
    allTenants?.forEach((t: any) => {
      tenantDataMap.set(t.id, {
        tenant: t,
        associations: [],
        properties: [],
        contacts: [],
      });
    });

    allAssociations?.forEach((a: any) => {
      const tenantId = a.tenant_id || a.business_id;
      if (tenantDataMap.has(tenantId)) {
        tenantDataMap.get(tenantId)!.associations.push(a);
      }
    });

    allProperties?.forEach((p: any) => {
      if (tenantDataMap.has(p.business_id)) {
        tenantDataMap.get(p.business_id)!.properties.push(p);
      }
    });

    allContacts?.forEach((c: any) => {
      if (tenantDataMap.has(c.tenant_id)) {
        tenantDataMap.get(c.tenant_id)!.contacts.push(c);
      }
    });

    // Find where this user's data is
    const userContacts = allContacts?.filter((c: any) => c.portal_user_id === authUser.id) || [];
    const userTenantIds = [...new Set(userContacts.map((c: any) => c.tenant_id))];

    return NextResponse.json({
      yourUserId: authUser.id,
      yourEmail: authUser.email,
      yourContactRecords: userContacts,
      yourTenantIds: userTenantIds,
      tenants: Array.from(tenantDataMap.values()).map(t => ({
        id: t.tenant.id,
        name: t.tenant.name,
        isYourTenant: userTenantIds.includes(t.tenant.id),
        associationCount: t.associations.length,
        propertyCount: t.properties.length,
        contactCount: t.contacts.length,
        associations: t.associations.slice(0, 5),
        properties: t.properties.slice(0, 5),
      })),
      errors: {
        tenants: tenantsError?.message,
        associations: assocError?.message,
        properties: propError?.message,
        contacts: contactError?.message,
      }
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}
