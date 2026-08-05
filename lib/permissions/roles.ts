import { PortalRole } from "@/schemas/portal/auth";

// Role hierarchy (higher index = more permissions)
export const ROLE_HIERARCHY: PortalRole[] = [
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

export function hasRole(userRoles: PortalRole[], requiredRole: PortalRole): boolean {
  return userRoles.includes(requiredRole);
}

export function hasAnyRole(userRoles: PortalRole[], requiredRoles: PortalRole[]): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}

export function hasAllRoles(userRoles: PortalRole[], requiredRoles: PortalRole[]): boolean {
  return requiredRoles.every((role) => userRoles.includes(role));
}

export function isAdmin(userRoles: PortalRole[]): boolean {
  return userRoles.includes("ADMIN_USER");
}

export function isManagement(userRoles: PortalRole[]): boolean {
  return userRoles.includes("STAFF") || 
         userRoles.includes("ADMIN_USER") ||
         userRoles.includes("PORTFOLIO_MANAGER") ||
         userRoles.includes("ASSOCIATION_MANAGER") ||
         userRoles.includes("PROPERTY_MANAGER") ||
         userRoles.includes("FINANCE_USER");
}

export function isBoard(userRoles: PortalRole[]): boolean {
  return userRoles.includes("BOARD_MEMBER");
}

export function isOwnerOrResident(userRoles: PortalRole[]): boolean {
  return userRoles.includes("OWNER") || userRoles.includes("RESIDENT");
}

export function isVendor(userRoles: PortalRole[]): boolean {
  return userRoles.includes("VENDOR");
}

// Get the primary role (highest in hierarchy)
export function getPrimaryRole(userRoles: PortalRole[]): PortalRole | null {
  for (let i = ROLE_HIERARCHY.length - 1; i >= 0; i--) {
    if (userRoles.includes(ROLE_HIERARCHY[i])) {
      return ROLE_HIERARCHY[i];
    }
  }
  return null;
}

// Get default route for role
export function getDefaultRouteForRole(role: PortalRole): string {
  switch (role) {
    case "ADMIN_USER":
    case "MANAGEMENT_STAFF":
      return "/management/overview";
    case "BOARD_MEMBER":
      return "/board";
    case "OWNER":
    case "RESIDENT":
      return "/owner";
    case "VENDOR":
      return "/vendor";
    default:
      return "/";
  }
}

// Get menu items for role
export interface MenuItem {
  label: string;
  href: string;
  icon?: string;
  children?: MenuItem[];
}

export function getMenuForRole(role: PortalRole): MenuItem[] {
  switch (role) {
    case "ADMIN_USER":
    case "MANAGEMENT_STAFF":
      return [
        { label: "Dashboard", href: "/management/overview", icon: "LayoutDashboard" },
        { label: "Associations", href: "/management/associations", icon: "Building2" },
        { label: "Properties", href: "/management/properties", icon: "Home" },
        { label: "Units", href: "/management/units", icon: "DoorOpen" },
        { label: "People", href: "/management/people", icon: "Users" },
        { label: "Maintenance", href: "/management/maintenance", icon: "Wrench" },
        { label: "Vendors", href: "/management/vendors", icon: "Truck" },
        { label: "Inspections", href: "/management/inspections", icon: "ClipboardCheck" },
        { label: "Documents", href: "/management/documents", icon: "FileText" },
        { label: "Compliance", href: "/management/compliance", icon: "Scale" },
        { label: "Approvals", href: "/management/approvals", icon: "CheckSquare" },
        { label: "Payments", href: "/management/payments", icon: "CircleDollarSign" },
        { label: "Communications", href: "/management/communications", icon: "MessageSquare" },
        { label: "Reports", href: "/management/reports", icon: "BarChart3" },
        { label: "Settings", href: "/management/settings", icon: "Settings" },
      ];

    case "BOARD_MEMBER":
      return [
        { label: "Board Home", href: "/board" },
        { label: "Association", href: "/board/association" },
        { label: "Approvals", href: "/board/approvals" },
        { label: "Maintenance", href: "/board/maintenance" },
        { label: "Inspections", href: "/board/inspections" },
        { label: "Compliance", href: "/board/compliance" },
        { label: "Documents", href: "/board/documents" },
        { label: "Meetings", href: "/board/meetings" },
        { label: "Reports", href: "/board/reports" },
        { label: "Announcements", href: "/board/announcements" },
        { label: "Directory", href: "/board/directory" },
      ];

    case "OWNER":
    case "RESIDENT":
      return [
        { label: "Home", href: "/owner" },
        { label: "My Property & Unit", href: "/owner/property" },
        { label: "Maintenance", href: "/owner/maintenance" },
        { label: "Inspections", href: "/owner/inspections" },
        { label: "Documents", href: "/owner/documents" },
        { label: "Notices", href: "/owner/notices" },
        { label: "Payments", href: "/owner/payments" },
        { label: "Messages", href: "/owner/messages" },
      ];

    case "VENDOR":
      return [
        { label: "Vendor Home", href: "/vendor" },
        { label: "Assigned Jobs", href: "/vendor/jobs" },
        { label: "Quotes", href: "/vendor/quotes" },
        { label: "Schedule", href: "/vendor/schedule" },
        { label: "Completed Work", href: "/vendor/history" },
        { label: "Invoices", href: "/vendor/invoices" },
        { label: "Documents", href: "/vendor/documents" },
        { label: "Company Profile", href: "/vendor/profile" },
        { label: "Messages", href: "/vendor/messages" },
      ];

    default:
      return [];
  }
}


