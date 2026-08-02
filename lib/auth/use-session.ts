"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SessionUser } from './session';

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
      
      setUser({
        id: user.id,
        email: user.email!,
        ghlContactId: metadata?.ghl_contact_id || "",
        roles: metadata?.roles || [],
        mfaEnabled: metadata?.mfa_enabled || false,
        status: metadata?.status || "ACTIVE",
      });
      setLoading(false);
    }

    getUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        setUser({
          id: session.user.id,
          email: session.user.email!,
          ghlContactId: metadata?.ghl_contact_id || "",
          roles: metadata?.roles || [],
          mfaEnabled: metadata?.mfa_enabled || false,
          status: metadata?.status || "ACTIVE",
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
