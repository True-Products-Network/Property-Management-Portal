/**
 * Portal Roles Configuration
 * These are the 10 standard roles for tenant/management portal users
 */

export const PORTAL_ROLES = {
  ADMIN_USER: {
    id: "admin_user",
    name: "Admin User",
    description: "Full portal administrative access",
    level: 100,
    dashboard: "/management",
  },
  PORTFOLIO_MANAGER: {
    id: "portfolio_manager",
    name: "Portfolio Manager",
    description: "Assigned Portfolio Operations and Management",
    level: 90,
    dashboard: "/management",
  },
  ASSOCIATION_MANAGER: {
    id: "association_manager",
    name: "Association Manager",
    description: "Assigned Association Management",
    level: 80,
    dashboard: "/management",
  },
  PROPERTY_MANAGER: {
    id: "property_manager",
    name: "Property Manager",
    description: "Assigned Property Management",
    level: 70,
    dashboard: "/management",
  },
  BOARD_MEMBER: {
    id: "board_member",
    name: "Board Member",
    description: "Assigned Board view and approvals",
    level: 60,
    dashboard: "/board",
  },
  VENDOR_CONTRACTOR: {
    id: "vendor_contractor",
    name: "Vendor Contractor",
    description: "Assigned Vendor Jobs",
    level: 50,
    dashboard: "/vendor",
  },
  RESIDENT: {
    id: "resident",
    name: "Resident",
    description: "Own associated records",
    level: 40,
    dashboard: "/resident",
  },
  OWNER: {
    id: "owner",
    name: "Owner",
    description: "Own associated records",
    level: 40,
    dashboard: "/owner",
  },
  STAFF: {
    id: "staff",
    name: "Staff",
    description: "Standard User Access",
    level: 30,
    dashboard: "/management",
  },
  FINANCE_USER: {
    id: "finance_user",
    name: "Finance User",
    description: "Financial Access Only",
    level: 20,
    dashboard: "/management",
  },
} as const;

export type PortalRoleId = keyof typeof PORTAL_ROLES;

// For database storage (simplified)
export const DB_ROLE_MAP: Record<string, string> = {
  admin_user: "admin",
  portfolio_manager: "admin",
  association_manager: "admin",
  property_manager: "member",
  board_member: "member",
  vendor_contractor: "member",
  resident: "member",
  owner: "member",
  staff: "member",
  finance_user: "member",
};

// Get all roles as array for dropdowns
export const getPortalRolesArray = () => {
  return Object.values(PORTAL_ROLES).map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    level: role.level,
  }));
};

// Get role by ID
export const getPortalRoleById = (id: string) => {
  return Object.values(PORTAL_ROLES).find((role) => role.id === id);
};

// Get dashboard route for role
export const getDashboardForRole = (roleId: string): string => {
  const role = getPortalRoleById(roleId);
  return role?.dashboard || "/management";
};

// Check if role has admin privileges
export const isAdminRole = (roleId: string): boolean => {
  const adminRoles = [
    "admin_user",
    "portfolio_manager",
    "association_manager",
  ];
  return adminRoles.includes(roleId);
};

// Check if role is management level
export const isManagementRole = (roleId: string): boolean => {
  const managementRoles = [
    "admin_user",
    "portfolio_manager",
    "association_manager",
    "property_manager",
    "staff",
    "finance_user",
  ];
  return managementRoles.includes(roleId);
};

// Check if role is board level
export const isBoardRole = (roleId: string): boolean => {
  return roleId === "board_member";
};

// Check if role is vendor
export const isVendorRole = (roleId: string): boolean => {
  return roleId === "vendor_contractor";
};

// Check if role is resident/owner
export const isResidentRole = (roleId: string): boolean => {
  return roleId === "resident" || roleId === "owner";
};
