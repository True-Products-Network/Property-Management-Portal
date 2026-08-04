"use client";

// Client-side hook for checking entity limits (properties, units, contacts)

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type EntityType = "properties" | "units" | "contacts" | "associations";

export interface EntityLimitState {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  isLoading: boolean;
  error: string | null;
}

export function useEntityLimit(entityType: EntityType): EntityLimitState {
  const [state, setState] = useState<EntityLimitState>({
    allowed: true,
    currentCount: 0,
    limit: 999999,
    remaining: 999999,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    checkLimit();
  }, [entityType]);

  async function checkLimit() {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        // No tenant = platform admin, allow unlimited
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Call the database function
      const { data, error } = await supabase
        .rpc("check_entity_limit", {
          p_tenant_id: tenantId,
          p_entity_type: entityType,
        });

      if (error) throw error;

      setState({
        allowed: data[0].allowed,
        currentCount: data[0].current_count,
        limit: data[0].limit_count,
        remaining: data[0].remaining,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error checking entity limit:", err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Unknown error",
        // Default to allowing if check fails
        allowed: true,
      }));
    }
  }

  return state;
}
