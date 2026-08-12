-- Tenant Seed: GHL Role Mappings
-- Seeds default GoHighLevel to portal role mappings
-- These are global mappings shared across all tenants (no tenant_id column)

DO $$
BEGIN
    -- Insert GHL Role Mappings (global table - no tenant_id)
    -- These map GoHighLevel contact roles to portal roles
    INSERT INTO ghl_role_mappings (
        ghl_contact_role,
        portal_role,
        portal_version,
        default_permissions,
        requires_mfa,
        status,
        description,
        user_count,
        created_at,
        updated_at
    ) VALUES
    ('Admin User', 'Admin User', 'v2', 'full_access', true, 'active', 'Full portal administration access with all permissions', 0, NOW(), NOW()),
    ('Board Approver', 'Board Approver', 'v2', 'approval_access', false, 'active', 'Can approve board-level requests and decisions', 0, NOW(), NOW()),
    ('Board Member', 'Board Member', 'v2', 'board_access', false, 'active', 'Assigned Board view and approval permissions', 0, NOW(), NOW()),
    ('Inspector', 'Inspector', 'v2', 'inspection_access', false, 'active', 'Can perform and manage property inspections', 0, NOW(), NOW()),
    ('Property Manager', 'Management Staff', 'v2', 'management_access', false, 'active', 'Assigned Property Management operations', 0, NOW(), NOW()),
    ('Owner', 'Owner', 'v2', 'owner_access', false, 'active', 'Own associated records and properties', 0, NOW(), NOW()),
    ('Resident', 'Resident', 'v2', 'resident_access', false, 'active', 'Access to own unit and building information', 0, NOW(), NOW()),
    ('Bookkeeper', 'Restricted Finance', 'v2', 'finance_readonly', false, 'active', 'Financial Access Only - view and reports', 0, NOW(), NOW()),
    ('Vendor Contact', 'Vendor Contact', 'v2', 'vendor_access', false, 'active', 'Vendor contact for job assignments', 0, NOW(), NOW())
    ON CONFLICT (portal_role, portal_version) DO NOTHING;

    RAISE NOTICE 'GHL role mappings seeded successfully';
END $$;
