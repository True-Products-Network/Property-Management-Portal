import { createClient as createServerClient } from "@/lib/supabase/server";
import { PortalRole } from "@/schemas/portal/auth";

export interface SessionUser {
  id: string;
  email: string;
  ghlContactId: string;
  roles: PortalRole[];
  mfaEnabled: boolean;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED" | "PENDING_INVITE";
  businessId?: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Get user metadata which includes GHL contact ID and roles
  const metadata = user.user_metadata;
  
  // Get the tenant_id from tenant_users table for proper multi-tenancy isolation
  // This is critical - user_metadata.business_id may not be set for platform-created users
  let businessId = metadata?.business_id;
  
  if (!businessId && user.id) {
    const { data: tenantUser, error: tenantError } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    
    if (tenantError) {
      console.error("[getSession] Error fetching tenant:", tenantError);
    }
    
    if (tenantUser?.tenant_id) {
      businessId = tenantUser.tenant_id;
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
