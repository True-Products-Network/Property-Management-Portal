"use client";

// Client-side entitlement checking hook
// Checks if the current tenant has access to specific features

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FeatureKey, EntitlementCheck } from "./types";

export type { FeatureKey, EntitlementCheck } from "./types";

/**
 * Check if a feature is entitled for the current tenant
 */
export function useEntitlement(featureKey: FeatureKey): EntitlementCheck {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number | undefined>();
  const [currentUsage, setCurrentUsage] = useState<number | undefined>();

  useEffect(() => {
    checkEntitlement();
  }, [featureKey]);

  async function checkEntitlement() {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      
      // Get current user's tenant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEnabled(false);
        return;
      }

      // Get user's tenant_id from metadata or users table
      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        // No tenant = platform admin or not properly set up, allow all
        setEnabled(true);
        return;
      }

      // Check tenant entitlements
      const { data: entitlement, error: entitlementError } = await supabase
        .from("tenant_entitlements")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("feature_key", featureKey)
        .single();

      if (entitlementError && entitlementError.code !== "PGRST116") {
        throw entitlementError;
      }

      if (!entitlement) {
        // Check if feature is in the base plan
        const { data: planFeature } = await supabase
          .from("plan_features")
          .select("plans!inner(tenant_subscriptions!inner(tenant_id))")
          .eq("feature_key", featureKey)
          .eq("plans.tenant_subscriptions.tenant_id", tenantId)
          .single();

        setEnabled(!!planFeature);
        return;
      }

      setEnabled(entitlement.enabled);
      setLimit(entitlement.usage_limit || undefined);
      setCurrentUsage(entitlement.current_usage || 0);
    } catch (err) {
      console.error("Error checking entitlement:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    enabled,
    isLoading,
    error,
    limit,
    currentUsage,
    hasReachedLimit: limit !== undefined && currentUsage !== undefined && currentUsage >= limit,
  };
}

/**
 * Check multiple entitlements at once
 */
export function useEntitlements(featureKeys: FeatureKey[]): Record<FeatureKey, EntitlementCheck> {
  const [results, setResults] = useState<Record<FeatureKey, EntitlementCheck>>(
    {} as Record<FeatureKey, EntitlementCheck>
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkEntitlements();
  }, [featureKeys.join(",")]);

  async function checkEntitlements() {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const emptyResults = featureKeys.reduce((acc, key) => {
          acc[key] = { enabled: false, isLoading: false, error: null, hasReachedLimit: false };
          return acc;
        }, {} as Record<FeatureKey, EntitlementCheck>);
        setResults(emptyResults);
        return;
      }

      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        // Platform admin - allow all
        const allEnabled = featureKeys.reduce((acc, key) => {
          acc[key] = { enabled: true, isLoading: false, error: null, hasReachedLimit: false };
          return acc;
        }, {} as Record<FeatureKey, EntitlementCheck>);
        setResults(allEnabled);
        return;
      }

      // Fetch all entitlements for this tenant
      const { data: entitlements, error } = await supabase
        .from("tenant_entitlements")
        .select("*")
        .eq("tenant_id", tenantId)
        .in("feature_key", featureKeys);

      if (error) throw error;

      const resultsMap = featureKeys.reduce((acc, key) => {
        const entitlement = entitlements?.find(e => e.feature_key === key);
        acc[key] = {
          enabled: entitlement?.enabled ?? false,
          isLoading: false,
          error: null,
          limit: entitlement?.usage_limit || undefined,
          currentUsage: entitlement?.current_usage || 0,
          hasReachedLimit: entitlement?.usage_limit 
            ? (entitlement.current_usage || 0) >= entitlement.usage_limit 
            : false,
        };
        return acc;
      }, {} as Record<FeatureKey, EntitlementCheck>);

      setResults(resultsMap);
    } catch (err) {
      console.error("Error checking entitlements:", err);
      const errorResults = featureKeys.reduce((acc, key) => {
        acc[key] = { 
          enabled: false, 
          isLoading: false, 
          error: err instanceof Error ? err.message : "Unknown error",
          hasReachedLimit: false 
        };
        return acc;
      }, {} as Record<FeatureKey, EntitlementCheck>);
      setResults(errorResults);
    } finally {
      setIsLoading(false);
    }
  }

  return results;
}
