import { createClient } from "@/lib/supabase/server";
import { Permission, hasPermission, hasAnyPermission } from "@/lib/config/permissions";

interface PermissionCheckResult {
  allowed: boolean;
  userId?: string;
  error?: string;
}

/**
 * Check if a user has a specific permission in a tenant
 */
export async function checkPermission(
  userId: string,
  tenantId: string,
  permission: Permission
): Promise<PermissionCheckResult> {
  const supabase = await createClient();

  try {
    // Get user permissions from database
    const { data, error } = await supabase
      .rpc("get_user_permissions", {
        p_user_id: userId,
        p_tenant_id: tenantId,
      });

    if (error) {
      console.error("Error checking permission:", error);
      return { allowed: false, userId, error: "Failed to check permissions" };
    }

    const userPermissions = data?.map((p: { permission_code: Permission }) => p.permission_code) || [];
    
    return {
      allowed: hasPermission(userPermissions, permission),
      userId,
    };
  } catch (err) {
    console.error("Error in checkPermission:", err);
    return { allowed: false, userId, error: "Permission check failed" };
  }
}

/**
 * Check if a user has any of the specified permissions
 */
export async function checkAnyPermission(
  userId: string,
  tenantId: string,
  permissions: Permission[]
): Promise<PermissionCheckResult> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .rpc("get_user_permissions", {
        p_user_id: userId,
        p_tenant_id: tenantId,
      });

    if (error) {
      console.error("Error checking permissions:", error);
      return { allowed: false, userId, error: "Failed to check permissions" };
    }

    const userPermissions = data?.map((p: { permission_code: Permission }) => p.permission_code) || [];
    
    return {
      allowed: hasAnyPermission(userPermissions, permissions),
      userId,
    };
  } catch (err) {
    console.error("Error in checkAnyPermission:", err);
    return { allowed: false, userId, error: "Permission check failed" };
  }
}

/**
 * Middleware wrapper for API routes
 * Usage: withPermission(handler, PERMISSIONS.PROPERTIES_VIEW)
 */
export function withPermission(
  handler: Function,
  permission: Permission
) {
  return async (request: Request, context: { params: Promise<{ tenantId: string }> }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const params = await context.params;
    const tenantId = params.tenantId;

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: "Tenant ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await checkPermission(user.id, tenantId, permission);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Insufficient permissions" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return handler(request, context);
  };
}

/**
 * Get all permissions for a user in a tenant
 */
export async function getUserPermissions(
  userId: string,
  tenantId: string
): Promise<Permission[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .rpc("get_user_permissions", {
        p_user_id: userId,
        p_tenant_id: tenantId,
      });

    if (error) {
      console.error("Error getting permissions:", error);
      return [];
    }

    return data?.map((p: { permission_code: Permission }) => p.permission_code) || [];
  } catch (err) {
    console.error("Error in getUserPermissions:", err);
    return [];
  }
}
