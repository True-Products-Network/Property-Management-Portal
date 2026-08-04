"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Permission, hasPermission as checkPermission, hasAnyPermission as checkAnyPermission } from "@/lib/config/permissions";

interface UsePermissionsReturn {
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(tenantId?: string): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPermissions = useCallback(async () => {
    if (!tenantId) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      // Get permissions from the database function
      const { data, error: permError } = await supabase
        .rpc("get_user_permissions", {
          p_user_id: user.id,
          p_tenant_id: tenantId,
        });

      if (permError) {
        console.error("Error fetching permissions:", permError);
        setError("Failed to load permissions");
        setPermissions([]);
      } else {
        setPermissions(data?.map((p: { permission_code: Permission }) => p.permission_code) || []);
      }
    } catch (err) {
      console.error("Error in usePermissions:", err);
      setError("Failed to load permissions");
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, supabase]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return checkPermission(permissions, permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((requiredPermissions: Permission[]): boolean => {
    return checkAnyPermission(permissions, requiredPermissions);
  }, [permissions]);

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    refreshPermissions: fetchPermissions,
  };
}

// Hook to check if user has a specific permission (simpler version)
export function useCan(permission: Permission, tenantId?: string): boolean {
  const { hasPermission, isLoading } = usePermissions(tenantId);
  
  if (isLoading) return false;
  return hasPermission(permission);
}

// Hook to check multiple permissions
export function useCanAny(permissions: Permission[], tenantId?: string): boolean {
  const { hasAnyPermission, isLoading } = usePermissions(tenantId);
  
  if (isLoading) return false;
  return hasAnyPermission(permissions);
}
