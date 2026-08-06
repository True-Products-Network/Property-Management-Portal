// Server-side entitlement checking
// Use in API routes and server components

import { createClient } from "@/lib/supabase/server";
import { FeatureKey } from "./types";

export async function checkEntitlementServer(
  tenantId: string,
  featureKey: FeatureKey
): Promise<{ enabled: boolean; limit?: number; currentUsage?: number }> {
  const supabase = await createClient();

  // First, look up the feature UUID from the code
  const { data: feature } = await supabase
    .from("features")
    .select("id")
    .eq("code", featureKey)
    .single();

  if (!feature) {
    console.log(`[Entitlements] Feature not found: ${featureKey}`);
    return { enabled: false };
  }

  const featureId = feature.id;

  // Check tenant entitlements
  const { data: entitlement, error } = await supabase
    .from("tenant_entitlements")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("feature_id", featureId)
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
    .select("*, plans!inner(tenant_subscriptions!inner(tenant_id))")
    .eq("feature_id", featureId)
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

  // First, look up the feature UUID from the code
  const { data: feature } = await supabase
    .from("features")
    .select("id")
    .eq("code", featureKey)
    .single();

  if (!feature) {
    console.log(`[Entitlements] Feature not found for usage increment: ${featureKey}`);
    return;
  }

  const featureId = feature.id;

  const { data: entitlement } = await supabase
    .from("tenant_entitlements")
    .select("current_usage")
    .eq("tenant_id", tenantId)
    .eq("feature_id", featureId)
    .single();

  if (entitlement) {
    await supabase
      .from("tenant_entitlements")
      .update({ 
        current_usage: (entitlement.current_usage || 0) + incrementBy,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("feature_id", featureId);
  }
}
