// Server-side entitlement checking
// Use in API routes and server components

import { createClient } from "@/lib/supabase/server";
import { FeatureKey } from "./types";

export async function checkEntitlementServer(
  tenantId: string,
  featureKey: FeatureKey
): Promise<{ enabled: boolean; limit?: number; currentUsage?: number }> {
  const supabase = await createClient();

  // Check tenant entitlements
  const { data: entitlement, error } = await supabase
    .from("tenant_entitlements")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("feature_id", featureKey)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (entitlement) {
    return {
      enabled: entitlement.enabled,
      limit: entitlement.usage_limit || undefined,
      currentUsage: entitlement.current_usage || 0,
    };
  }

  // Check plan features
  const { data: planFeature } = await supabase
    .from("plan_features")
    .select("*")
    .eq("feature_id", featureKey)
    .eq("plans.tenant_subscriptions.tenant_id", tenantId)
    .single();

  return {
    enabled: !!planFeature,
  };
}

export async function incrementEntitlementUsage(
  tenantId: string,
  featureKey: FeatureKey,
  incrementBy: number = 1
): Promise<void> {
  const supabase = await createClient();

  const { data: entitlement } = await supabase
    .from("tenant_entitlements")
    .select("current_usage")
    .eq("tenant_id", tenantId)
    .eq("feature_id", featureKey)
    .single();

  if (entitlement) {
    await supabase
      .from("tenant_entitlements")
      .update({ 
        current_usage: (entitlement.current_usage || 0) + incrementBy,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("feature_id", featureKey);
  }
}
