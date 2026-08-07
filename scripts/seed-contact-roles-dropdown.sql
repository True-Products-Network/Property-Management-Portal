-- Seed contact roles into dropdown_settings for configurable roles
-- Run this in Supabase SQL Editor

INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, tenant_id)
VALUES 
    ('contact', 'role', 'admin_user', 'Admin User', 1, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'role', 'association_manager', 'Association Manager', 2, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'board_member', 'Board Member', 3, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'finance_user', 'Finance User', 4, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'owner', 'Owner', 5, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'portfolio_manager', 'Portfolio Manager', 6, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'resident', 'Resident', 7, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'staff', 'Staff', 8, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'vendor_contractor', 'Vendor Contractor', 9, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'property_manager', 'Property Manager', 10, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'emergency_contact', 'Emergency Contact', 11, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'inspector', 'Inspector', 12, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'co_owner', 'Co-Owner', 13, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'maintenance_contact', 'Maintenance Contact', 14, '93f8cdcf-7dcd-4d83-8117-67d869eab88b'),
    ('contact', 'other', 'Other', 15, '93f8cdcf-7dcd-4d83-8117-67d869eab88b')
ON CONFLICT (record_type, field_name, value) DO UPDATE SET
    label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    tenant_id = EXCLUDED.tenant_id;
