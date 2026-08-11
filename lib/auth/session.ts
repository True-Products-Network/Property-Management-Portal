import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";
import { PortalRole } from "@/schemas/portal/auth";

export interface TenantInfo {
  id: string;
  name: string;
  role: string;
}

export interface SessionUser {
  id: string;
  email: string;
  ghlContactId: string;
  roles: PortalRole[];
  mfaEnabled: boolean;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED" | "PENDING_INVITE";
  businessId?: string;
  tenants: TenantInfo[];
}

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createServerClient();
  const cookieStore = await cookies();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Get user metadata which includes GHL contact ID and roles
  const metadata = user.user_metadata;
  
  // Get ALL tenants for this user from tenant_users table
  const { data: tenantUsers, error: tenantsError } = await supabase
    .from("tenant_users")
    .select("tenant_id, role, tenants(name)")
    .eq("user_id", user.id);
  
  if (tenantsError) {
    console.error("[getSession] Error fetching tenants:", tenantsError);
  }
  
  // Also get tenant from contacts table where this user is the portal_user
  // This is the authoritative source for which tenant the user's data belongs to
  const { data: contactTenants, error: contactTenantsError } = await supabase
    .from("contacts")
    .select("tenant_id, tenants(name)")
    .eq("portal_user_id", user.id)
    .not("tenant_id", "is", null);
  
  if (contactTenantsError) {
    console.error("[getSession] Error fetching contact tenants:", contactTenantsError);
  }
  
  // Merge tenants from both sources (tenant_users and contacts)
  const tenantMap = new Map<string, TenantInfo>();
  
  // Add tenants from tenant_users
  (tenantUsers || []).forEach((tu: any) => {
    tenantMap.set(tu.tenant_id, {
      id: tu.tenant_id,
      name: tu.tenants?.name || "Unknown",
      role: tu.role,
    });
  });
  
  // Add tenants from contacts (these are the authoritative source for data ownership)
  (contactTenants || []).forEach((ct: any) => {
    if (!tenantMap.has(ct.tenant_id)) {
      tenantMap.set(ct.tenant_id, {
        id: ct.tenant_id,
        name: ct.tenants?.name || "Unknown",
        role: "user", // Default role if only found via contacts
      });
    }
  });
  
  const tenants: TenantInfo[] = Array.from(tenantMap.values());
  const userTenantIds = tenants.map(t => t.id);
  
  // Check for active tenant cookie
  const activeTenantId = cookieStore.get("active_tenant_id")?.value;
  
  // Determine which tenant to use:
  // 1. Active tenant cookie (if user still belongs to it)
  // 2. First tenant from contacts (authoritative for data)
  // 3. First tenant from tenant_users
  let selectedTenantId = activeTenantId;
  
  if (activeTenantId && tenants.some(t => t.id === activeTenantId)) {
    selectedTenantId = activeTenantId;
  } else if (contactTenants && contactTenants.length > 0) {
    // Prioritize the tenant from contacts table as that's where the data is
    selectedTenantId = contactTenants[0].tenant_id;
  } else if (tenants.length > 0) {
    selectedTenantId = tenants[0].id;
  }
  
  // Check for active business cookie first
  const activeBusinessId = cookieStore.get("active_business_id")?.value;
  
  // Look up the business record for this tenant
  // Use service client to bypass RLS since we've already authenticated the user
  const serviceClient = createServiceClient();
  let businessId: string | undefined;
  
  if (activeBusinessId) {
    // Verify the active business belongs to this user
    const { data: activeBusiness } = await serviceClient
      .from("businesses")
      .select("id, slug")
      .eq("id", activeBusinessId)
      .maybeSingle();
    
    if (activeBusiness && userTenantIds.includes(activeBusiness.slug)) {
      businessId = activeBusiness.id;
    }
  }
  
  // If no active business or invalid, look up by tenant
  if (!businessId && selectedTenantId) {
    const { data: business } = await serviceClient
      .from("businesses")
      .select("id")
      .eq("slug", selectedTenantId)
      .maybeSingle();
    
    if (business) {
      businessId = business.id;
    }
  }
  
  return {
    id: user.id,
    email: user.email!,
    ghlContactId: metadata?.ghl_contact_id || "",
    roles: metadata?.roles || [],
    mfaEnabled: metadata?.mfa_enabled || false,
    status: metadata?.status || "ACTIVE",
    businessId: businessId,
    tenants: tenants,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await requireAuth();
  const hasRole = user.roles.some((role) => allowedRoles.includes(role));
  if (!hasRole) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(["ADMIN_USER"]);
}

export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
}
