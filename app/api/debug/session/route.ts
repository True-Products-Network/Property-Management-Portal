// Debug API to diagnose session and data linkage issues
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// CORS headers
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
    
    // Get auth user directly
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
    
    // Get user metadata
    const metadata = authUser.user_metadata;
    
    // Look up tenant_users
    const { data: tenantUsers, error: tenantUsersError } = await supabase
      .from("tenant_users")
      .select("tenant_id, role, is_primary_admin")
      .eq("user_id", authUser.id);
    
    // Look up contacts where this user is the portal_user
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id, tenant_id, first_name, last_name, email, portal_user_id, portal_invitation_status")
      .eq("portal_user_id", authUser.id);
    
    // Get the tenant ID from contacts (authoritative) or tenant_users
    const contactTenantId = contacts?.[0]?.tenant_id;
    const tenantUserId = tenantUsers?.[0]?.tenant_id;
    const effectiveTenantId = contactTenantId || tenantUserId || metadata?.business_id;
    
    // Look up associations in the effective tenant
    let associations: any[] = [];
    let associationsError: any = null;
    if (effectiveTenantId) {
      const result = await supabase
        .from("associations")
        .select("id, name, business_id, tenant_id")
        .eq("business_id", effectiveTenantId)
        .limit(10);
      associations = result.data || [];
      associationsError = result.error;
    }
    
    // Look up properties in the effective tenant
    let properties: any[] = [];
    let propertiesError: any = null;
    if (effectiveTenantId) {
      const result = await supabase
        .from("properties")
        .select("id, name, business_id")
        .eq("business_id", effectiveTenantId)
        .limit(5);
      properties = result.data || [];
      propertiesError = result.error;
    }
    
    return NextResponse.json({
      authUser: {
        id: authUser.id,
        email: authUser.email,
        metadata: metadata,
      },
      tenantResolution: {
        fromContacts: contactTenantId,
        fromTenantUsers: tenantUserId,
        fromMetadata: metadata?.business_id,
        effectiveTenantId: effectiveTenantId,
      },
      tenantUsers: {
        data: tenantUsers,
        error: tenantUsersError?.message,
        count: tenantUsers?.length || 0,
      },
      contacts: {
        data: contacts,
        error: contactsError?.message,
        count: contacts?.length || 0,
      },
      associations: {
        data: associations,
        error: associationsError?.message,
        count: associations?.length || 0,
      },
      properties: {
        data: properties,
        error: propertiesError?.message,
        count: properties?.length || 0,
      },
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
