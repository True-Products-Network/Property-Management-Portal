// Server-side entitlement checking
// Use in API routes and server components

import { createClient } from "@/lib/supabase/server";
import { FeatureKey } from "./types";

export async function checkEntitlementServer(
  tenantId: string,
  featureKey: FeatureKey
): Promise<{ enabled: boolean; limit?: number; currentUsage?: number }> {
  const supabase = await createClient();

  console.log(`[Entitlements] Checking ${featureKey} for tenant ${tenantId}`);

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
  console.log(`[Entitlements] Found feature ${featureKey} with ID ${featureId}`);

  // Check tenant entitlements
  const { data: entitlement, error } = await supabase
    .from("tenant_entitlements")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("feature_id", featureId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.log(`[Entitlements] Error checking tenant_entitlements:`, error);
    throw error;
  }

  if (entitlement) {
    console.log(`[Entitlements] Found tenant_entitlement:`, entitlement);
    return {
      enabled: entitlement.is_enabled,
      limit: entitlement.limit_value || undefined,
      currentUsage: entitlement.current_usage || 0,
    };
  }

  console.log(`[Entitlements] No tenant_entitlement found, checking plan_features`);

  // Get the tenant's active subscription plan
  const { data: subscription } = await supabase
    .from("tenant_subscriptions")
    .select("plan_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .maybeSingle();

  console.log(`[Entitlements] Tenant subscription:`, subscription);

  if (!subscription) {
    console.log(`[Entitlements] No active subscription found for tenant ${tenantId}`);
    return { enabled: false };
  }

  // Check plan features directly
  const { data: planFeature, error: planError } = await supabase
    .from("plan_features")
    .select("*")
    .eq("plan_id", subscription.plan_id)
    .eq("feature_id", featureId)
    .maybeSingle();

  console.log(`[Entitlements] Plan feature check:`, { planFeature, planError });

  return {
    enabled: !!planFeature && planFeature.is_enabled !== false,
    limit: planFeature?.limit_value || undefined,
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
