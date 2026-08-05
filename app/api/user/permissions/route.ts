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

    // Get user's role from user_metadata
    const userRoles = user.user_metadata?.roles || [];
    const primaryRole = userRoles[0];

    if (!primaryRole) {
      return NextResponse.json({ 
        permissions: [],
        menu: [],
        role: null 
      });
    }

    // Fetch role details from portal_roles
    const { data: roleData, error: roleError } = await supabase
      .from("portal_roles")
      .select("name, description, permissions, requires_mfa")
      .eq("name", primaryRole)
      .eq("status", "active")
      .single();

    if (roleError || !roleData) {
      console.error("Error fetching role:", roleError);
      return NextResponse.json({ 
        permissions: [],
        menu: [],
        role: primaryRole 
      });
    }

    // Build menu from permissions
    const permissions = roleData.permissions || [];
    const menu = buildMenuFromPermissions(permissions);

    return NextResponse.json({
      success: true,
      role: {
        name: roleData.name,
        description: roleData.description,
        requires_mfa: roleData.requires_mfa,
      },
      permissions: permissions,
      menu: menu,
    });
  } catch (error) {
    console.error("Error in GET /api/user/permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Build menu structure from permissions
function buildMenuFromPermissions(permissions: any[]): any[] {
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
  
  // Dashboard always first
  if (permissions.some((p: any) => p.module === "dashboard" && p.read)) {
    menu.push({
      id: "dashboard",
      items: [{
        label: "Dashboard",
        href: "/management/overview",
        icon: "LayoutDashboard",
      }],
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
