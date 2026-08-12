-- Tenant Seed: GHL Role Mappings
-- Run this to seed default GHL role mappings for a new tenant
-- Usage: This creates tenant-specific copies of the global GHL mappings

-- Insert GHL Role Mappings for the tenant
-- These map GoHighLevel contact roles to portal roles

INSERT INTO ghl_role_mappings (
    ghl_contact_role,
    portal_role,
    portal_version,
    default_permissions,
    requires_mfa,
    status,
    description,
    user_count
) VALUES
('Admin User', 'Admin User', 'v2', 'full_access', true, 'active', 'Full portal administration access with all permissions', 0),
('Board Approver', 'Board Approver', 'v2', 'approval_access', false, 'active', 'Can approve board-level requests and decisions', 0),
('Board Member', 'Board Member', 'v2', 'board_access', false, 'active', 'Assigned Board view and approval permissions', 0),
('Inspector', 'Inspector', 'v2', 'inspection_access', false, 'active', 'Can perform and manage property inspections', 0),
('Property Manager', 'Management Staff', 'v2', 'management_access', false, 'active', 'Assigned Property Management operations', 0),
('Owner', 'Owner', 'v2', 'owner_access', false, 'active', 'Own associated records and properties', 0),
('Resident', 'Resident', 'v2', 'resident_access', false, 'active', 'Access to own unit and building information', 0),
('Bookkeeper', 'Restricted Finance', 'v2', 'finance_readonly', false, 'active', 'Financial Access Only - view and reports', 0),
('Vendor Contact', 'Vendor Contact', 'v2', 'vendor_access', false, 'active', 'Vendor contact for job assignments', 0)
ON CONFLICT (portal_role, portal_version) DO NOTHING;

-- Note: These are global mappings that apply to all tenants
-- The ghl_role_mappings table doesn't have tenant_id, so these are shared
-- If tenant-specific mappings are needed in the future, add tenant_id column
