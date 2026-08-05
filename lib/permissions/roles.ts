import { createClient } from "@/lib/supabase/server";

// Menu item interface
export interface MenuItem {
  label: string;
  href: string;
  icon?: string;
  children?: MenuItem[];
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
    approve: boolean;
  };
}

// Permission check result
export interface PermissionCheck {
  read: boolean;
  write: boolean;
  delete: boolean;
  approve: boolean;
}

/**
 * Fetch user's role and permissions from the database
 */
export async function getUserPermissions(userId: string): Promise<{
  role: string | null;
  permissions: any[];
  menu: MenuItem[];
} | null> {
  const supabase = await createClient();

  // Get user's roles from user_metadata
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const userRoles = user.user_metadata?.roles || [];
  const primaryRole = userRoles[0];

  if (!primaryRole) {
    return { role: null, permissions: [], menu: [] };
  }

  // Fetch role details from portal_roles
  const { data: roleData, error } = await supabase
    .from("portal_roles")
    .select("name, description, permissions, requires_mfa, redirect_url")
    .eq("name", primaryRole)
    .eq("status", "active")
    .single();

  if (error || !roleData) {
    console.error("Error fetching role permissions:", error);
    return { role: primaryRole, permissions: [], menu: [] };
  }

  // Build menu from permissions
  const menu = buildMenuFromPermissions(roleData.permissions || []);

  return {
    role: roleData.name,
    permissions: roleData.permissions || [],
    menu,
  };
}

/**
 * Check if user has a specific permission for a module
 */
export function checkPermission(
  permissions: any[],
  module: string,
  action: "read" | "write" | "delete" | "approve"
): boolean {
  const modulePerm = permissions.find((p) => p.module === module);
  if (!modulePerm) return false;
  return modulePerm[action] === true;
}

/**
 * Build menu structure from permissions
 */
function buildMenuFromPermissions(permissions: any[]): MenuItem[] {
  const menuGroups: Record<string, any> = {
    dashboard: { id: "dashboard", label: "Dashboard", items: [] },
    entities: { id: "entities", label: "Entities", items: [] },
    operations: { id: "operations", label: "Operations", items: [] },
    financial: { id: "financial", label: "Financial", items: [] },
    communications: { id: "communications", label: "Communications", items: [] },
  };

  const moduleIcons: Record<string, string> = {
    dashboard: "LayoutDashboard",
    associations: "Building2",
    properties: "Home",
    units: "DoorOpen",
    people: "Users",
    vendors: "Truck",
    maintenance: "Wrench",
    inspections: "ClipboardCheck",
    documents: "FileText",
    approvals: "CheckSquare",
    compliance: "Scale",
    payments: "CircleDollarSign",
    communications: "MessageSquare",
    reports: "BarChart3",
    settings: "Settings",
  };

  const moduleRoutes: Record<string, string> = {
    dashboard: "/management/overview",
    associations: "/management/associations",
    properties: "/management/properties",
    units: "/management/units",
    people: "/management/people",
    vendors: "/management/vendors",
    maintenance: "/management/maintenance",
    inspections: "/management/inspections",
    documents: "/management/documents",
    approvals: "/management/approvals",
    compliance: "/management/compliance",
    payments: "/management/payments",
    communications: "/management/communications",
    reports: "/management/reports",
    settings: "/management/settings",
  };

  const moduleGroups: Record<string, string> = {
    dashboard: "dashboard",
    associations: "entities",
    properties: "entities",
    units: "entities",
    people: "entities",
    vendors: "entities",
    maintenance: "operations",
    inspections: "operations",
    documents: "operations",
    approvals: "operations",
    compliance: "operations",
    payments: "financial",
    communications: "communications",
    reports: "communications",
    settings: "communications",
  };

  // Process each permission
  permissions.forEach((perm: any) => {
    if (perm.read && perm.module !== "dashboard") {
      const groupKey = moduleGroups[perm.module];
      if (groupKey && menuGroups[groupKey]) {
        menuGroups[groupKey].items.push({
          label: perm.module.charAt(0).toUpperCase() + perm.module.slice(1),
          href: moduleRoutes[perm.module] || `/management/${perm.module}`,
          icon: moduleIcons[perm.module] || "Circle",
          permissions: {
            read: perm.read,
            write: perm.write,
            delete: perm.delete,
            approve: perm.approve,
          },
        });
      }
    }
  });

  // Build final menu array
  const menu: MenuItem[] = [];

  // Dashboard always first if user has access
  if (permissions.some((p: any) => p.module === "dashboard" && p.read)) {
    menu.push({
      label: "Dashboard",
      href: "/management/overview",
      icon: "LayoutDashboard",
    });
  }

  // Add other groups if they have items
  Object.values(menuGroups).forEach((group: any) => {
    if (group.id !== "dashboard" && group.items.length > 0) {
      menu.push(...group.items);
    }
  });

  return menu;
}

/**
 * Get redirect URL for a role from the database
 */
export async function getRedirectUrlForRole(
  supabase: any,
  role: string
): Promise<string> {
  const { data: roleData } = await supabase
    .from("portal_roles")
    .select("redirect_url, name")
    .eq("name", role)
    .single();

  if (roleData?.redirect_url) {
    return roleData.redirect_url;
  }

  // Default fallback based on role name patterns
  const roleLower = role.toLowerCase();
  if (roleLower.includes("board")) {
    return "/board";
  }
  if (roleLower.includes("owner") || roleLower.includes("resident")) {
    return "/owner";
  }
  if (roleLower.includes("vendor")) {
    return "/vendor";
  }

  return "/management/overview";
}

// Role hierarchy for determining primary role (higher index = more permissions)
// This is used for display purposes only - permissions should be checked via database
const ROLE_HIERARCHY: string[] = [
  "VENDOR",
  "RESIDENT",
  "OWNER",
  "STAFF",
  "FINANCE_USER",
  "BOARD_MEMBER",
  "PROPERTY_MANAGER",
  "ASSOCIATION_MANAGER",
  "PORTFOLIO_MANAGER",
  "ADMIN_USER",
];

/**
 * Get the primary role (highest in hierarchy) from user's roles
 * This is used for UI display purposes, not permission checks
 */
export function getPrimaryRole(userRoles: string[]): string | null {
  if (!userRoles || userRoles.length === 0) return null;
  
  for (let i = ROLE_HIERARCHY.length - 1; i >= 0; i--) {
    if (userRoles.includes(ROLE_HIERARCHY[i])) {
      return ROLE_HIERARCHY[i];
    }
  }
  // If no match in hierarchy, return first role
  return userRoles[0];
}

// Legacy helper functions - these check against user_metadata.roles
// These are kept for backward compatibility but should be replaced with permission-based checks

export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}

export function hasAllRoles(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.every((role) => userRoles.includes(role));
}

export function isAdmin(userRoles: string[]): boolean {
  return userRoles.includes("ADMIN_USER");
}

// DEPRECATED: Use permission-based checks instead
// These functions are kept for backward compatibility during migration
export function isManagement(userRoles: string[]): boolean {
  const managementRoles = [
    "ADMIN_USER",
    "STAFF",
    "FINANCE_USER",
    "PROPERTY_MANAGER",
    "ASSOCIATION_MANAGER",
    "PORTFOLIO_MANAGER",
  ];
  return userRoles.some((role) => managementRoles.includes(role));
}

export function isBoard(userRoles: string[]): boolean {
  return userRoles.includes("BOARD_MEMBER");
}

export function isOwnerOrResident(userRoles: string[]): boolean {
  return userRoles.includes("OWNER") || userRoles.includes("RESIDENT");
}

export function isVendor(userRoles: string[]): boolean {
  return userRoles.includes("VENDOR");
}

// DEPRECATED: Menu should be fetched from /api/user/permissions
// This function is kept for backward compatibility but returns empty array
export function getMenuForRole(_role: string): MenuItem[] {
  console.warn(
    "getMenuForRole is deprecated. Use /api/user/permissions endpoint instead."
  );
  return [];
}

// DEPRECATED: Use getRedirectUrlForRole from database instead
export function getDefaultRouteForRole(_role: string): string {
  console.warn(
    "getDefaultRouteForRole is deprecated. Use getRedirectUrlForRole from database instead."
  );
  return "/management/overview";
}
