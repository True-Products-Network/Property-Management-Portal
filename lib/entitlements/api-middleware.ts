// API Middleware for entitlement checking
// Use in API routes to protect form submissions

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FeatureKey } from "./types";
import { checkEntitlementServer, incrementEntitlementUsage } from "./server";

interface EntitlementMiddlewareOptions {
  featureKey: FeatureKey;
  incrementUsage?: boolean;
  requireEnabled?: boolean;
}

/**
 * Middleware to check entitlements for API routes
 * Usage: wrap your API handler with this function
 */
export function withEntitlement(
  options: EntitlementMiddlewareOptions,
  handler: (req: NextRequest, user: { id: string; tenantId?: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const supabase = await createClient();
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Get tenant ID from user metadata
      const tenantId = user.user_metadata?.tenant_id;
      
      // Platform admins bypass entitlement checks
      const isPlatformAdmin = user.user_metadata?.roles?.includes("PLATFORM_ADMIN");
      if (isPlatformAdmin) {
        return handler(req, { id: user.id, tenantId });
      }

      // If no tenant ID, check if this is a business user
      if (!tenantId) {
        // For users without tenant, allow if not requiring specific feature
        if (!options.requireEnabled) {
          return handler(req, { id: user.id });
        }
        return NextResponse.json(
          { error: "No tenant assigned. Please contact support." },
          { status: 403 }
        );
      }

      // Check entitlement
      const entitlement = await checkEntitlementServer(tenantId, options.featureKey);

      if (!entitlement.enabled) {
        return NextResponse.json(
          { 
            error: "Feature not enabled", 
            message: `The "${options.featureKey}" feature is not enabled for your business. Please contact your Platform Administrator to enable this feature.`,
            code: "FEATURE_NOT_ENTITLED",
            feature: options.featureKey,
            action: "Contact your Platform Admin to enable this feature in the Entitlements section."
          },
          { status: 403 }
        );
      }

      // Check if limit reached
      if (entitlement.limit !== undefined && entitlement.currentUsage !== undefined) {
        if (entitlement.currentUsage >= entitlement.limit) {
          return NextResponse.json(
            { 
              error: "Usage limit reached", 
              message: `You've reached your limit of ${entitlement.limit} for "${options.featureKey}". Contact your Platform Administrator to increase your limit.`,
              code: "LIMIT_REACHED",
              feature: options.featureKey,
              limit: entitlement.limit,
              currentUsage: entitlement.currentUsage,
              action: "Contact your Platform Admin to increase the limit in the Entitlements section."
            },
            { status: 403 }
          );
        }
      }

      // Call the handler
      const response = await handler(req, { id: user.id, tenantId });

      // Increment usage if the request was successful and incrementUsage is true
      if (options.incrementUsage && response.status >= 200 && response.status < 300) {
        try {
          await incrementEntitlementUsage(tenantId, options.featureKey);
        } catch (err) {
          console.error("Error incrementing entitlement usage:", err);
          // Don't fail the request if usage tracking fails
        }
      }

      return response;
    } catch (error) {
      console.error("Entitlement middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Simple entitlement check for API routes
 * Returns true if entitled, false otherwise
 */
export async function checkRouteEntitlement(
  req: NextRequest,
  featureKey: FeatureKey
): Promise<{ allowed: boolean; error?: string; tenantId?: string }> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { allowed: false, error: "Unauthorized" };
    }

    const tenantId = user.user_metadata?.tenant_id;
    const isPlatformAdmin = user.user_metadata?.roles?.includes("PLATFORM_ADMIN");
    
    if (isPlatformAdmin) {
      return { allowed: true, tenantId };
    }

    // Look up tenant from tenant_users if not in session
    let effectiveTenantId = tenantId;
    if (!effectiveTenantId) {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();
      effectiveTenantId = tenantUser?.tenant_id;
    }

    if (!effectiveTenantId) {
      return { allowed: false, error: "No tenant assigned" };
    }

    const entitlement = await checkEntitlementServer(effectiveTenantId, featureKey);

    if (!entitlement.enabled) {
      // Log entitlement denial to audit log
      const { logAudit } = await import("@/lib/api/audit-logs");
      await logAudit({
        userId: user.id,
        tenantId: effectiveTenantId,
        action: "ENTITLEMENT_DENIED",
        entityType: "feature",
        entityId: featureKey,
        details: { reason: "Feature not enabled in plan" },
      });
      return { 
        allowed: false, 
        error: `Feature ${featureKey} is not available in your plan`,
        tenantId: effectiveTenantId 
      };
    }

    if (entitlement.limit !== undefined && entitlement.currentUsage !== undefined) {
      if (entitlement.currentUsage >= entitlement.limit) {
        // Log limit reached to audit log
        const { logAudit } = await import("@/lib/api/audit-logs");
        await logAudit({
          userId: user.id,
          tenantId: effectiveTenantId,
          action: "ENTITLEMENT_LIMIT_REACHED",
          entityType: "feature",
          entityId: featureKey,
          details: { 
            limit: entitlement.limit,
            currentUsage: entitlement.currentUsage 
          },
        });
        return { 
          allowed: false, 
          error: `Usage limit reached: ${entitlement.currentUsage}/${entitlement.limit}`,
          tenantId: effectiveTenantId 
        };
      }
    }

    return { allowed: true, tenantId: effectiveTenantId };
  } catch (error) {
    console.error("Error checking route entitlement:", error);
    return { allowed: false, error: "Internal server error" };
  }
}

export { incrementEntitlementUsage } from "./server";
