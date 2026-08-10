import { createClient as createServerClient } from "@/lib/supabase/server";
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
  
  // Get ALL tenants for this user
  const { data: tenantUsers, error: tenantsError } = await supabase
    .from("tenant_users")
    .select("tenant_id, role, tenants(name)")
    .eq("user_id", user.id);
  
  if (tenantsError) {
    console.error("[getSession] Error fetching tenants:", tenantsError);
  }
  
  const tenants: TenantInfo[] = (tenantUsers || []).map((tu: any) => ({
    id: tu.tenant_id,
    name: tu.tenants?.name || "Unknown",
    role: tu.role,
  }));
  
  // Check for active tenant cookie
  const activeTenantId = cookieStore.get("active_tenant_id")?.value;
  
  // Determine which tenant to use:
  // 1. Active tenant cookie (if user still belongs to it)
  // 2. First tenant in list
  let businessId = metadata?.business_id;
  
  if (activeTenantId && tenants.some(t => t.id === activeTenantId)) {
    businessId = activeTenantId;
  } else if (tenants.length > 0) {
    businessId = tenants[0].id;
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
