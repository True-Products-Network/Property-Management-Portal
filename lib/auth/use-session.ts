"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SessionUser, TenantInfo } from './session';
import { User, Session } from '@supabase/supabase-js';

async function fetchTenants(supabase: ReturnType<typeof createClient>, userId: string): Promise<TenantInfo[]> {
  // Get tenants from tenant_users table
  const { data: tenantUsers, error } = await supabase
    .from("tenant_users")
    .select("tenant_id, role, tenants(name)")
    .eq("user_id", userId);
  
  if (error) {
    console.error("[useSession] Error fetching tenants:", error);
  }
  
  // Also get tenant from contacts table where this user is the portal_user
  // This is the authoritative source for which tenant the user's data belongs to
  const { data: contactTenants, error: contactTenantsError } = await supabase
    .from("contacts")
    .select("tenant_id, tenants(name)")
    .eq("portal_user_id", userId)
    .not("tenant_id", "is", null);
  
  if (contactTenantsError) {
    console.error("[useSession] Error fetching contact tenants:", contactTenantsError);
  }
  
  // Merge tenants from both sources
  const tenantMap = new Map<string, TenantInfo>();
  
  // Add tenants from tenant_users
  (tenantUsers || []).forEach((tu: any) => {
    tenantMap.set(tu.tenant_id, {
      id: tu.tenant_id,
      name: tu.tenants?.name || "Unknown",
      role: tu.role,
    });
  });
  
  // Add tenants from contacts (authoritative for data ownership)
  (contactTenants || []).forEach((ct: any) => {
    if (!tenantMap.has(ct.tenant_id)) {
      tenantMap.set(ct.tenant_id, {
        id: ct.tenant_id,
        name: ct.tenants?.name || "Unknown",
        role: "user", // Default role if only found via contacts
      });
    }
  });
  
  return Array.from(tenantMap.values());
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const metadata = user.user_metadata;
      
      // Fetch tenants for multi-tenant support
      const tenants = await fetchTenants(supabase, user.id);
      
      setUser({
        id: user.id,
        email: user.email!,
        ghlContactId: metadata?.ghl_contact_id || "",
        roles: metadata?.roles || [],
        mfaEnabled: metadata?.mfa_enabled || false,
        status: metadata?.status || "ACTIVE",
        tenants: tenants,
      });
      setLoading(false);
    }

    getUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        
        // Fetch tenants for multi-tenant support
        const tenants = await fetchTenants(supabase, session.user.id);
        
        setUser({
          id: session.user.id,
          email: session.user.email!,
          ghlContactId: metadata?.ghl_contact_id || "",
          roles: metadata?.roles || [],
          mfaEnabled: metadata?.mfa_enabled || false,
          status: metadata?.status || "ACTIVE",
          tenants: tenants,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
