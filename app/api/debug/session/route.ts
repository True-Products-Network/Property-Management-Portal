// Debug API to diagnose session and data linkage issues
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }
    
    // Get raw auth user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    // Look up tenant_users
    const { data: tenantUsers, error: tenantUsersError } = await supabase
      .from("tenant_users")
      .select("tenant_id, role, is_primary_admin")
      .eq("user_id", session.id);
    
    // Look up contacts where this user is the portal_user
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id, tenant_id, first_name, last_name, email, portal_user_id, portal_invitation_status")
      .eq("portal_user_id", session.id);
    
    // Look up associations in the session's businessId
    const { data: associations, error: associationsError } = await supabase
      .from("associations")
      .select("id, name, business_id, tenant_id")
      .eq("business_id", session.businessId || 'no-business-id');
    
    // Look up properties in the session's businessId
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, name, business_id")
      .eq("business_id", session.businessId || 'no-business-id')
      .limit(5);
    
    return NextResponse.json({
      session: {
        id: session.id,
        email: session.email,
        businessId: session.businessId,
        tenants: session.tenants,
        roles: session.roles,
      },
      authUser: {
        id: authUser?.id,
        email: authUser?.email,
        metadata: authUser?.user_metadata,
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
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
