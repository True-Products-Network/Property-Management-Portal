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

    // Get user's role from user_metadata for regular users
    const userRoles = user.user_metadata?.roles || [];
    const primaryRole = userRoles[0];

    if (!primaryRole) {
      return NextResponse.json({ 
        permissions: [],
        menu: [],
        role: null,
        isPlatformAdmin: false,
      });
    }

    // Try to find role - handle different naming conventions
    // user_metadata might have "ADMIN_USER" but portal_roles has "Admin User"
    const roleVariations = [
      primaryRole, // exact match
      primaryRole.replace(/_/g, " "), // ADMIN_USER -> ADMIN USER
      primaryRole.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()), // ADMIN_USER -> Admin User (title case)
      primaryRole.replace(/_/g, "_"), // just in case
    ];
    
    // Also add common variations
    if (primaryRole === "ADMIN_USER") {
      roleVariations.push("Admin User");
    } else if (primaryRole === "PORTFOLIO_MANAGER") {
      roleVariations.push("Portfolio Manager");
    } else if (primaryRole === "ASSOCIATION_MANAGER") {
      roleVariations.push("Association Manager");
    } else if (primaryRole === "PROPERTY_MANAGER") {
      roleVariations.push("Property Manager");
    } else if (primaryRole === "BOARD_MEMBER") {
      roleVariations.push("Board Member");
    } else if (primaryRole === "VENDOR_CONTRACTOR") {
      roleVariations.push("Vendor Contractor");
    } else if (primaryRole === "RESIDENT") {
      roleVariations.push("Resident");
    } else if (primaryRole === "OWNER") {
      roleVariations.push("Owner");
    } else if (primaryRole === "STAFF") {
      roleVariations.push("Staff");
    } else if (primaryRole === "FINANCE_USER") {
      roleVariations.push("Finance User");
    }

    // Fetch role details from roles table - try different name formats
    let roleData = null;
    for (const roleName of roleVariations) {
      const { data, error } = await supabase
        .from("roles")
        .select("name, description, permissions, requires_mfa")
        .eq("name", roleName)
        .eq("is_active", true)
        .maybeSingle();
      
      if (data) {
        roleData = data;
        break;
      }
    }

    if (!roleData) {
      console.error("Role not found in roles:", primaryRole, "tried:", roleVariations);
      return NextResponse.json({ 
        permissions: [],
        menu: [],
        role: primaryRole,
        isPlatformAdmin: false,
      });
    }



    // Build menu from permissions
    const permissions = roleData.permissions || [];
    const menu = buildMenuFromPermissions(permissions, roleData.name);

    return NextResponse.json({
      success: true,
      role: {
        name: roleData.name,
        description: roleData.description,
        requires_mfa: roleData.requires_mfa,
      },
      permissions: permissions,
      menu: menu,
      isPlatformAdmin: false,
    });
  } catch (error) {
    console.error("Error in GET /api/user/permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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
function buildMenuFromPermissions(permissions: any[], roleName: string): any[] {
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
  
  // Dashboard always first - label depends on role
  if (permissions.some((p: any) => p.module === "dashboard" && p.read)) {
    // Portfolio Manager sees "Portfolio", others see "Dashboard"
    const isPortfolioManager = roleName === "Portfolio Manager" || roleName === "PORTFOLIO_MANAGER";
    menu.push({
      id: "dashboard",
      items: [
        { label: isPortfolioManager ? "Portfolio" : "Dashboard", href: "/management/overview", icon: "LayoutDashboard" },
      ],
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
