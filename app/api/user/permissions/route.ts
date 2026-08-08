import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/user/permissions - Get current user's permissions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is platform admin
    const isPlatformAdmin = user.user_metadata?.is_platform_admin === true;

    // If platform admin, return platform admin menu
    if (isPlatformAdmin) {
      return NextResponse.json({
        success: true,
        role: {
          name: "Platform Admin",
          description: "Full platform administration access",
          requires_mfa: true,
        },
        permissions: getPlatformAdminPermissions(),
        menu: getPlatformAdminMenu(),
        isPlatformAdmin: true,
      });
    }

    // Get user's roles from user_metadata for regular users
    const userRoles = user.user_metadata?.roles || [];

    if (userRoles.length === 0) {
      return NextResponse.json({ 
        permissions: [],
        menu: [],
        role: null,
        isPlatformAdmin: false,
      });
    }

    // Get variations for all user roles
    const allRoleVariations: string[] = [];
    for (const userRole of userRoles) {
      const variations = getRoleVariations(userRole);
      allRoleVariations.push(...variations);
    }

    // Fetch all role details from roles table
    const { data: roleDataList, error: rolesError } = await supabase
      .from("roles")
      .select("name, description, permissions, requires_mfa")
      .in("name", allRoleVariations)
      .eq("is_active", true);

    if (rolesError || !roleDataList || roleDataList.length === 0) {
      console.error("Roles not found:", userRoles, "tried:", allRoleVariations);
      return NextResponse.json({ 
        permissions: [],
        menu: [],
        role: userRoles[0],
        isPlatformAdmin: false,
      });
    }

    // Merge permissions from all roles (OR logic - if any role has permission, user has it)
    const mergedPermissions = mergePermissions(roleDataList.map((r: { permissions: any }) => r.permissions || []));
    
    // Collect all role names for menu labeling
    const roleNames = roleDataList.map((r: { name: string }) => r.name);

    // Build menu from merged permissions
    const menu = buildMenuFromPermissions(mergedPermissions, roleNames);

    // Return primary role info (first role) but include all roles
    const primaryRoleData = roleDataList[0];

    return NextResponse.json({
      success: true,
      role: {
        name: primaryRoleData.name,
        description: primaryRoleData.description,
        requires_mfa: primaryRoleData.requires_mfa,
      },
      roles: roleNames,
      permissions: mergedPermissions,
      menu: menu,
      isPlatformAdmin: false,
    });
  } catch (error) {
    console.error("Error in GET /api/user/permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get all possible variations of a role name for matching
function getRoleVariations(roleName: string): string[] {
  const variations = [
    roleName, // exact match
    roleName.replace(/_/g, " "), // ADMIN_USER -> ADMIN USER
    roleName.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()), // ADMIN_USER -> Admin User
  ];

  // Add common variations
  const commonVariations: Record<string, string[]> = {
    "ADMIN_USER": ["Admin User"],
    "PORTFOLIO_MANAGER": ["Portfolio Manager"],
    "ASSOCIATION_MANAGER": ["Association Manager"],
    "PROPERTY_MANAGER": ["Property Manager"],
    "BOARD_MEMBER": ["Board Member"],
    "VENDOR_CONTRACTOR": ["Vendor Contractor"],
    "RESIDENT": ["Resident"],
    "OWNER": ["Owner"],
    "STAFF": ["Staff"],
    "FINANCE_USER": ["Finance User"],
  };

  if (commonVariations[roleName]) {
    variations.push(...commonVariations[roleName]);
  }

  return [...new Set(variations)];
}

// Merge permissions from multiple roles (OR logic)
function mergePermissions(permissionsList: any[][]): any[] {
  const permissionMap = new Map<string, any>();

  for (const permissions of permissionsList) {
    for (const perm of permissions) {
      const existing = permissionMap.get(perm.module);
      if (existing) {
        // OR the permissions together
        existing.read = existing.read || perm.read;
        existing.write = existing.write || perm.write;
        existing.delete = existing.delete || perm.delete;
        existing.approve = existing.approve || perm.approve;
      } else {
        permissionMap.set(perm.module, { ...perm });
      }
    }
  }

  return Array.from(permissionMap.values());
}

// Platform Admin permissions (full access)
function getPlatformAdminPermissions(): any[] {
  const modules = [
    "dashboard", "tenants", "users", "plans", "features", 
    "entitlements", "integrations", "audit", "settings", "health"
  ];
  
  return modules.map((module) => ({
    module,
    read: true,
    write: true,
    delete: true,
    approve: true,
  }));
}

// Platform Admin menu structure
function getPlatformAdminMenu(): any[] {
  return [
    {
      id: "dashboard",
      items: [
        { label: "Dashboard", href: "/platform", icon: "LayoutDashboard" },
      ],
    },
    {
      id: "management",
      label: "Management",
      items: [
        { label: "Tenants", href: "/platform/tenants", icon: "Building2" },
        { label: "Users", href: "/platform/users", icon: "Users" },
      ],
    },
    {
      id: "platform",
      label: "Platform",
      items: [
        { label: "Plans", href: "/platform/plans", icon: "CreditCard" },
        { label: "Features", href: "/platform/features", icon: "CheckSquare" },
        { label: "Entitlements", href: "/platform/entitlements", icon: "Shield" },
      ],
    },
    {
      id: "system",
      label: "System",
      items: [
        { label: "Integrations", href: "/platform/integrations", icon: "Plug" },
        { label: "Audit Log", href: "/platform/audit", icon: "ClipboardList" },
        { label: "Site Settings", href: "/platform/site-settings", icon: "Settings" },
        { label: "Health", href: "/platform/health", icon: "Activity" },
      ],
    },
  ];
}

// Build menu structure from permissions for regular users
function buildMenuFromPermissions(permissions: any[], roleNames: string[]): any[] {
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

  // Build final menu array, only including groups with items
  const menu = [];
  
  // Dashboard/Portfolio menu items - depends on roles
  if (permissions.some((p: any) => p.module === "dashboard" && p.read)) {
    const dashboardItems = [];
    
    // Check if user has Portfolio Manager role (or Admin User who sees both)
    const hasPortfolioManager = roleNames.some(r => 
      r === "Portfolio Manager" || r === "PORTFOLIO_MANAGER" ||
      r === "Admin User" || r === "ADMIN_USER"
    );
    
    // Check if user has Association Manager or other association-level role (or Admin User who sees both)
    const hasAssociationRole = roleNames.some(r => 
      r === "Association Manager" || r === "ASSOCIATION_MANAGER" ||
      r === "Property Manager" || r === "PROPERTY_MANAGER" ||
      r === "Board Member" || r === "BOARD_MEMBER" ||
      r === "Admin User" || r === "ADMIN_USER"
    );
    
    // Portfolio Manager sees "Portfolio"
    if (hasPortfolioManager) {
      dashboardItems.push({ 
        label: "Portfolio", 
        href: "/management/overview", 
        icon: "LayoutDashboard" 
      });
    }
    
    // Association roles see "Dashboard" (or both if they have both roles)
    if (hasAssociationRole) {
      dashboardItems.push({ 
        label: "Dashboard", 
        href: "/management/overview", 
        icon: "LayoutDashboard" 
      });
    }
    
    // If neither specific role matched but they have dashboard permission, show Dashboard
    if (dashboardItems.length === 0) {
      dashboardItems.push({ 
        label: "Dashboard", 
        href: "/management/overview", 
        icon: "LayoutDashboard" 
      });
    }
    
    menu.push({
      id: "dashboard",
      items: dashboardItems,
    });
  }

  // Add other groups if they have items
  Object.values(menuGroups).forEach((group: any) => {
    if (group.id !== "dashboard" && group.items.length > 0) {
      menu.push(group);
    }
  });

  return menu;
}
