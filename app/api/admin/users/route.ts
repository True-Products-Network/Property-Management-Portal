import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Association {
  id: string;
  name: string;
}

// GET /api/admin/users - Get all users from contacts table
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if current user is admin
    console.log("[Admin Users API] Checking admin status for user ID:", authUser.id);
    
    // Check portal_users first
    const { data: currentUser } = await supabase
      .from("portal_users")
      .select("id, email, is_admin, status")
      .eq("id", authUser.id)
      .maybeSingle();

    // Also check if user is platform admin
    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .is("revoked_at", null)
      .maybeSingle();
    
    const isPlatformAdmin = platformRole?.role === "PLATFORM_ADMIN" || authUser.user_metadata?.is_platform_admin === true;
    
    // Check tenant_users for admin role
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("role, is_primary_admin")
      .eq("user_id", authUser.id)
      .maybeSingle();
    
    const isTenantAdmin = tenantUser?.role === "admin" || tenantUser?.is_primary_admin === true;
    
    // Check user metadata for portal role
    const portalRole = authUser.user_metadata?.portal_role;
    const isAdminRole = portalRole === "admin_user" || portalRole === "ADMIN_USER";

    console.log("[Admin Users API] Current user lookup result:", { 
      currentUser, 
      isPlatformAdmin, 
      tenantUser, 
      isTenantAdmin, 
      portalRole,
      isAdminRole 
    });

    // Allow access if user is admin in any context
    if (!currentUser?.is_admin && !isPlatformAdmin && !isTenantAdmin && !isAdminRole) {
      console.error("[Admin Users API] User is not admin:", authUser.id);
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get user's tenant ID(s) - tenant admins can only see their own tenant's users
    const { data: userTenants } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", authUser.id);
    
    const userTenantIds = userTenants?.map((ut: any) => ut.tenant_id) || [];
    
    console.log("[Admin Users API] User tenant IDs:", userTenantIds);

    // Get query params
    const { searchParams } = new URL(request.url);
    const associationId = searchParams.get("associationId");
    const tenantIdParam = searchParams.get("tenantId");

    // Get contacts filtered by tenant
    // Platform admins can see all (or filter by tenantId), tenant admins only see their tenant's contacts
    let contactsQuery = supabase
      .from("contacts")
      .select(`
        id,
        contact_id,
        first_name,
        last_name,
        email,
        phone,
        portal_invitation_status,
        portal_user_id,
        tenant_id,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });
    
    // Filter by tenant
    if (isPlatformAdmin && tenantIdParam) {
      // Platform admin can filter by specific tenant
      contactsQuery = contactsQuery.eq("tenant_id", tenantIdParam);
    } else if (!isPlatformAdmin && userTenantIds.length > 0) {
      // Tenant admins only see their own tenants
      contactsQuery = contactsQuery.in("tenant_id", userTenantIds);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      console.error("[Admin Users API] Error fetching contacts:", contactsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users: " + contactsError.message },
        { status: 500 }
      );
    }

    // Get portal user IDs from contacts
    const portalUserIds = (contacts || [])
      .map((c: any) => c.portal_user_id)
      .filter((id: string | null): id is string => !!id);

    // Get user's roles for role information
    let roleMap = new Map<string, string>();
    if (portalUserIds.length > 0) {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, role_id, roles(name)")
        .in("user_id", portalUserIds);

      (userRoles || []).forEach((ur: any) => {
        const roleName = ur.roles?.name || "Unknown";
        roleMap.set(ur.user_id, roleName);
      });
    }

    // Get associations for context
    const { data: associations } = await supabase
      .from("associations")
      .select("id, name")
      .limit(100);

    const associationMap = new Map((associations as Association[] || []).map((a: Association) => [a.id, a.name]));

    // Get tenants for context
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, name")
      .limit(100);

    const tenantMap = new Map((tenants || []).map((t: any) => [t.id, t.name]));

    // Map contacts to users
    const mappedUsers = (contacts || []).map((contact: any) => {
      const firstName = contact.first_name;
      const lastName = contact.last_name;
      const fullName = firstName && lastName 
        ? `${firstName} ${lastName}` 
        : firstName || lastName || contact.email;
      
      return {
        id: contact.portal_user_id || contact.id,
        contactId: contact.id,
        portalUserId: contact.portal_user_id,
        email: contact.email,
        firstName: firstName || null,
        lastName: lastName || null,
        name: fullName,
        role: contact.portal_user_id ? roleMap.get(contact.portal_user_id) || "User" : "Contact",
        status: contact.portal_invitation_status?.toLowerCase() || "none",
        ghlContactId: contact.contact_id,
        createdAt: contact.created_at,
        lastSignInAt: contact.updated_at,
        tenantId: contact.tenant_id,
        tenantName: tenantMap.get(contact.tenant_id) || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedUsers,
      meta: {
        total: mappedUsers.length,
        associationId: associationId || null,
      }
    });
  } catch (error) {
    console.error("[Admin Users API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
