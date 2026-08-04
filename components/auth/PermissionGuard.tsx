"use client";

import { ReactNode } from "react";
import { usePermissions, useCan, useCanAny } from "@/lib/hooks/usePermissions";
import { Permission } from "@/lib/config/permissions";
import { Loader2 } from "lucide-react";

interface PermissionGuardProps {
  permission: Permission;
  tenantId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface PermissionGuardAnyProps {
  permissions: Permission[];
  tenantId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface PermissionGuardAllProps {
  permissions: Permission[];
  tenantId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

// Guard that checks for a single permission
export function PermissionGuard({ 
  permission, 
  tenantId, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { isLoading, hasPermission } = usePermissions(tenantId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Guard that checks if user has ANY of the permissions
export function PermissionGuardAny({ 
  permissions, 
  tenantId, 
  children, 
  fallback = null 
}: PermissionGuardAnyProps) {
  const { isLoading, hasAnyPermission } = usePermissions(tenantId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Guard that checks if user has ALL of the permissions
export function PermissionGuardAll({ 
  permissions, 
  tenantId, 
  children, 
  fallback = null 
}: PermissionGuardAllProps) {
  const { isLoading, permissions: userPermissions } = usePermissions(tenantId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const hasAll = permissions.every(p => userPermissions.includes(p));
  
  if (!hasAll) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Simpler components for inline use
interface CanProps {
  permission: Permission;
  tenantId?: string;
  children: ReactNode;
}

interface CanAnyProps {
  permissions: Permission[];
  tenantId?: string;
  children: ReactNode;
}

export function Can({ permission, tenantId, children }: CanProps) {
  const allowed = useCan(permission, tenantId);
  if (!allowed) return null;
  return <>{children}</>;
}

export function CanAny({ permissions, tenantId, children }: CanAnyProps) {
  const allowed = useCanAny(permissions, tenantId);
  if (!allowed) return null;
  return <>{children}</>;
}
