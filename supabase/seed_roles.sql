-- Seed default portal roles
-- Run this in your Supabase SQL Editor to populate the roles table

-- First, check if roles table exists and create if not
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(name, tenant_id)
);

-- Create role_permissions table if not exists
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(role_id, permission_code)
);

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role_id, tenant_id)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Insert system roles (tenant_id IS NULL means system-wide)
INSERT INTO roles (id, name, description, is_system_role, is_active, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Admin User', 'Full portal administration access', true, true, now(), now()),
    ('00000000-0000-0000-0000-000000000002', 'Portfolio Manager', 'Assigned Portfolio Operations and Management', true, true, now(), now()),
    ('00000000-0000-0000-0000-000000000003', 'Association Manager', 'Assigned Association Management', true, true, now(), now()),
    ('00000000-0000-0000-0000-000000000004', 'Property Manager', 'Assigned Property Management', true, true, now(), now()),
    ('00000000-0000-0000-0000-000000000005', 'Board Member', 'Assigned Board view and approvals', true, true, now(), now()),
    ('00000000-0000-0000-0000-000000000006', 'Vendor Contractor', 'Assigned Vendor Jobs', true, true, now(), now()),
    ('00000000-0000-0000-0000-000000000007', 'Resident', 'Own associated records', true, true, now(), now()),
    ('00000000-0000-0000-0000-000000000008', 'Owner', 'Own associated records', true, true, now(), now()),
    ('00000000-0000-0000-0000-000000000009', 'Staff', 'Standard User Access', true, true, now(), now()),
    ('00000000-0000-0000-0000-000000000010', 'Finance User', 'Financial Access Only', true, true, now(), now())
ON CONFLICT (name, tenant_id) DO UPDATE SET
    description = EXCLUDED.description,
    is_system_role = EXCLUDED.is_system_role,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Insert permissions for Admin User (full access)
INSERT INTO role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000001', unnest(ARRAY[
    'dashboard:read', 'dashboard:write', 'dashboard:delete', 'dashboard:approve',
    'associations:read', 'associations:write', 'associations:delete', 'associations:approve',
    'properties:read', 'properties:write', 'properties:delete', 'properties:approve',
    'units:read', 'units:write', 'units:delete', 'units:approve',
    'people:read', 'people:write', 'people:delete', 'people:approve',
    'vendors:read', 'vendors:write', 'vendors:delete', 'vendors:approve',
    'maintenance:read', 'maintenance:write', 'maintenance:delete', 'maintenance:approve',
    'inspections:read', 'inspections:write', 'inspections:delete', 'inspections:approve',
    'documents:read', 'documents:write', 'documents:delete', 'documents:approve',
    'approvals:read', 'approvals:write', 'approvals:delete', 'approvals:approve',
    'compliance:read', 'compliance:write', 'compliance:delete', 'compliance:approve',
    'payments:read', 'payments:write', 'payments:delete', 'payments:approve',
    'communications:read', 'communications:write', 'communications:delete', 'communications:approve',
    'reports:read', 'reports:write', 'reports:delete', 'reports:approve',
    'settings:read', 'settings:write', 'settings:delete', 'settings:approve'
])
ON CONFLICT (role_id, permission_code) DO NOTHING;

-- Insert permissions for Portfolio Manager
INSERT INTO role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000002', unnest(ARRAY[
    'dashboard:read', 'dashboard:write',
    'associations:read', 'associations:write',
    'properties:read', 'properties:write',
    'units:read', 'units:write',
    'people:read', 'people:write',
    'vendors:read', 'vendors:write',
    'maintenance:read', 'maintenance:write', 'maintenance:approve',
    'inspections:read', 'inspections:write', 'inspections:approve',
    'documents:read', 'documents:write',
    'approvals:read', 'approvals:approve',
    'compliance:read', 'compliance:write',
    'payments:read', 'payments:write',
    'communications:read', 'communications:write',
    'reports:read', 'reports:write'
])
ON CONFLICT (role_id, permission_code) DO NOTHING;

-- Insert permissions for Association Manager
INSERT INTO role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000003', unnest(ARRAY[
    'dashboard:read', 'dashboard:write',
    'associations:read', 'associations:write',
    'properties:read', 'properties:write',
    'units:read', 'units:write',
    'people:read', 'people:write',
    'vendors:read', 'vendors:write',
    'maintenance:read', 'maintenance:write', 'maintenance:approve',
    'inspections:read', 'inspections:write', 'inspections:approve',
    'documents:read', 'documents:write',
    'approvals:read', 'approvals:approve',
    'compliance:read', 'compliance:write',
    'payments:read', 'payments:write',
    'communications:read', 'communications:write',
    'reports:read'
])
ON CONFLICT (role_id, permission_code) DO NOTHING;

-- Insert permissions for Property Manager
INSERT INTO role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000004', unnest(ARRAY[
    'dashboard:read', 'dashboard:write',
    'properties:read', 'properties:write',
    'units:read', 'units:write',
    'people:read', 'people:write',
    'vendors:read', 'vendors:write',
    'maintenance:read', 'maintenance:write', 'maintenance:approve',
    'inspections:read', 'inspections:write',
    'documents:read', 'documents:write',
    'payments:read', 'payments:write',
    'communications:read', 'communications:write',
    'reports:read'
])
ON CONFLICT (role_id, permission_code) DO NOTHING;

-- Insert permissions for Board Member
INSERT INTO role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000005', unnest(ARRAY[
    'dashboard:read',
    'associations:read',
    'properties:read',
    'documents:read',
    'reports:read',
    'approvals:read', 'approvals:approve'
])
ON CONFLICT (role_id, permission_code) DO NOTHING;

-- Insert permissions for Vendor Contractor
INSERT INTO role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000006', unnest(ARRAY[
    'dashboard:read',
    'maintenance:read', 'maintenance:write',
    'inspections:read'
])
ON CONFLICT (role_id, permission_code) DO NOTHING;

-- Insert permissions for Resident
INSERT INTO role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000007', unnest(ARRAY[
    'dashboard:read',
    'units:read',
    'maintenance:read', 'maintenance:write',
    'documents:read'
])
ON CONFLICT (role_id, permission_code) DO NOTHING;

-- Insert permissions for Owner
INSERT INTO role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000008', unnest(ARRAY[
    'dashboard:read',
    'properties:read',
    'units:read',
    'maintenance:read', 'maintenance:write',
    'documents:read',
    'payments:read'
])
ON CONFLICT (role_id, permission_code) DO NOTHING;

-- Insert permissions for Staff
INSERT INTO role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000009', unnest(ARRAY[
    'dashboard:read',
    'associations:read',
    'properties:read',
    'people:read'
])
ON CONFLICT (role_id, permission_code) DO NOTHING;

-- Insert permissions for Finance User
INSERT INTO role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000010', unnest(ARRAY[
    'dashboard:read',
    'payments:read', 'payments:write',
    'reports:read'
])
ON CONFLICT (role_id, permission_code) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for roles table
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify seeding
SELECT r.name, r.description, r.is_system_role, r.is_active, COUNT(rp.permission_code) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.is_system_role = true
GROUP BY r.id, r.name, r.description, r.is_system_role, r.is_active
ORDER BY r.name;