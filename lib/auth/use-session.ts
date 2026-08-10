"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SessionUser, TenantInfo } from './session';
import { User, Session } from '@supabase/supabase-js';

async function fetchTenants(supabase: ReturnType<typeof createClient>, userId: string): Promise<TenantInfo[]> {
  const { data: tenantUsers, error } = await supabase
    .from("tenant_users")
    .select("tenant_id, role, tenants(name)")
    .eq("user_id", userId);
  
  if (error) {
    console.error("[useSession] Error fetching tenants:", error);
    return [];
  }
  
  return (tenantUsers || []).map((tu: any) => ({
    id: tu.tenant_id,
    name: tu.tenants?.name || "Unknown",
    role: tu.role,
  }));
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
