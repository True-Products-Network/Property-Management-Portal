// Entity Limit Checking for Properties, Units, Contacts
// Enforces plan-based limits on core entities

import { createClient } from "@/lib/supabase/server";

export type EntityType = "properties" | "units" | "contacts" | "associations";

export interface EntityLimitCheck {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
}

/**
 * Check if tenant can add more entities
 */
export async function checkEntityLimit(
  tenantId: string,
  entityType: EntityType
): Promise<EntityLimitCheck> {
  const supabase = await createClient();

  // Call the database function
  const { data, error } = await supabase
    .rpc("check_entity_limit", {
      p_tenant_id: tenantId,
      p_entity_type: entityType,
    });

  if (error) {
    console.error("Error checking entity limit:", error);
    // Default to allowing if check fails
    return { allowed: true, currentCount: 0, limit: 999999, remaining: 999999 };
  }

  return {
    allowed: data[0].allowed,
    currentCount: data[0].current_count,
    limit: data[0].limit_count,
    remaining: data[0].remaining,
  };
}

/**
 * Middleware for API routes to check entity limits
 */
export async function checkRouteEntityLimit(
  req: Request,
  entityType: EntityType
): Promise<{ allowed: boolean; error?: string; tenantId?: string; remaining?: number }> {
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

    if (!tenantId) {
      return { allowed: false, error: "No tenant assigned" };
    }

    const limitCheck = await checkEntityLimit(tenantId, entityType);

    if (!limitCheck.allowed) {
      return { 
        allowed: false, 
        error: `You've reached your limit of ${limitCheck.limit} ${entityType}. Please upgrade your plan to add more.`,
        tenantId,
        remaining: 0
      };
    }

    return { 
      allowed: true, 
      tenantId,
      remaining: limitCheck.remaining
    };
  } catch (error) {
    console.error("Error checking entity limit:", error);
    return { allowed: false, error: "Internal server error" };
  }
}
