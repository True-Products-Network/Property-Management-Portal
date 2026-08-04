-- Create roles table for custom role definitions
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false, -- true for the 10 standard roles
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(tenant_id, name)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    module TEXT NOT NULL, -- dashboard, properties, maintenance, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_code)
);

-- Create user_roles table (extends tenant_users with custom roles)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(tenant_user_id, role_id)
);

-- Insert default permissions
INSERT INTO permissions (code, name, description, module) VALUES
-- Dashboard
('dashboard.view', 'View Dashboard', 'Access the main dashboard', 'dashboard'),
('dashboard.manage', 'Manage Dashboard', 'Customize dashboard widgets', 'dashboard'),

-- Associations
('associations.view', 'View Associations', 'View association details', 'associations'),
('associations.create', 'Create Associations', 'Create new associations', 'associations'),
('associations.edit', 'Edit Associations', 'Edit association details', 'associations'),
('associations.delete', 'Delete Associations', 'Delete associations', 'associations'),

-- Properties
('properties.view', 'View Properties', 'View property details', 'properties'),
('properties.create', 'Create Properties', 'Create new properties', 'properties'),
('properties.edit', 'Edit Properties', 'Edit property details', 'properties'),
('properties.delete', 'Delete Properties', 'Delete properties', 'properties'),

-- Units
('units.view', 'View Units', 'View unit details', 'units'),
('units.create', 'Create Units', 'Create new units', 'units'),
('units.edit', 'Edit Units', 'Edit unit details', 'units'),
('units.delete', 'Delete Units', 'Delete units', 'units'),

-- People
('people.view', 'View People', 'View contact details', 'people'),
('people.create', 'Create People', 'Create new contacts', 'people'),
('people.edit', 'Edit People', 'Edit contact details', 'people'),
('people.delete', 'Delete People', 'Delete contacts', 'people'),

-- Vendors
('vendors.view', 'View Vendors', 'View vendor details', 'vendors'),
('vendors.create', 'Create Vendors', 'Create new vendors', 'vendors'),
('vendors.edit', 'Edit Vendors', 'Edit vendor details', 'vendors'),
('vendors.delete', 'Delete Vendors', 'Delete vendors', 'vendors'),

-- Maintenance
('maintenance.view', 'View Maintenance', 'View maintenance requests', 'maintenance'),
('maintenance.create', 'Create Maintenance', 'Create maintenance requests', 'maintenance'),
('maintenance.edit', 'Edit Maintenance', 'Edit maintenance requests', 'maintenance'),
('maintenance.delete', 'Delete Maintenance', 'Delete maintenance requests', 'maintenance'),
('maintenance.approve', 'Approve Maintenance', 'Approve maintenance requests', 'maintenance'),

-- Inspections
('inspections.view', 'View Inspections', 'View inspections', 'inspections'),
('inspections.create', 'Create Inspections', 'Create new inspections', 'inspections'),
('inspections.edit', 'Edit Inspections', 'Edit inspections', 'inspections'),
('inspections.delete', 'Delete Inspections', 'Delete inspections', 'inspections'),

-- Documents
('documents.view', 'View Documents', 'View documents', 'documents'),
('documents.create', 'Create Documents', 'Upload documents', 'documents'),
('documents.edit', 'Edit Documents', 'Edit document metadata', 'documents'),
('documents.delete', 'Delete Documents', 'Delete documents', 'documents'),

-- Approvals
('approvals.view', 'View Approvals', 'View approval requests', 'approvals'),
('approvals.create', 'Create Approvals', 'Create approval requests', 'approvals'),
('approvals.vote', 'Vote on Approvals', 'Vote on approval requests', 'approvals'),
('approvals.manage', 'Manage Approvals', 'Manage approval workflow', 'approvals'),

-- Compliance
('compliance.view', 'View Compliance', 'View compliance items', 'compliance'),
('compliance.create', 'Create Compliance', 'Create compliance items', 'compliance'),
('compliance.edit', 'Edit Compliance', 'Edit compliance items', 'compliance'),
('compliance.delete', 'Delete Compliance', 'Delete compliance items', 'compliance'),

-- Payments
('payments.view', 'View Payments', 'View payments', 'payments'),
('payments.create', 'Create Payments', 'Record payments', 'payments'),
('payments.edit', 'Edit Payments', 'Edit payments', 'payments'),
('payments.delete', 'Delete Payments', 'Delete payments', 'payments'),
('payments.refund', 'Refund Payments', 'Process refunds', 'payments'),

-- Communications
('communications.view', 'View Communications', 'View messages and announcements', 'communications'),
('communications.create', 'Create Communications', 'Send messages and announcements', 'communications'),
('communications.edit', 'Edit Communications', 'Edit communications', 'communications'),
('communications.delete', 'Delete Communications', 'Delete communications', 'communications'),

-- Reports
('reports.view', 'View Reports', 'View reports', 'reports'),
('reports.create', 'Create Reports', 'Create custom reports', 'reports'),
('reports.export', 'Export Reports', 'Export report data', 'reports'),

-- Settings
('settings.view', 'View Settings', 'View settings', 'settings'),
('settings.edit', 'Edit Settings', 'Edit settings', 'settings'),

-- Admin (Platform level)
('admin.users.manage', 'Manage Users', 'Manage system users', 'admin'),
('admin.roles.manage', 'Manage Roles', 'Manage roles and permissions', 'admin'),
('admin.tenants.manage', 'Manage Tenants', 'Manage tenants', 'admin'),
('admin.system.settings', 'System Settings', 'Manage system settings', 'admin')
ON CONFLICT (code) DO NOTHING;

-- Insert system roles (the 10 standard roles)
INSERT INTO roles (name, description, is_system_role, is_active) VALUES
('Admin User', 'Full portal administrative access', true, true),
('Portfolio Manager', 'Assigned Portfolio Operations and Management', true, true),
('Association Manager', 'Assigned Association Management', true, true),
('Property Manager', 'Assigned Property Management', true, true),
('Board Member', 'Assigned Board view and approvals', true, true),
('Vendor Contractor', 'Assigned Vendor Jobs', true, true),
('Resident', 'Own associated records', true, true),
('Owner', 'Own associated records', true, true),
('Staff', 'Standard User Access', true, true),
('Finance User', 'Financial Access Only', true, true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission_code);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_user ON user_roles(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY roles_tenant_isolation ON roles
    FOR ALL USING (
        tenant_id IS NULL -- System roles visible to all
        OR tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY permissions_read_all ON permissions
    FOR SELECT USING (true);

CREATE POLICY role_permissions_tenant_isolation ON role_permissions
    FOR ALL USING (
        role_id IN (
            SELECT id FROM roles WHERE tenant_id IS NULL 
            OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
        )
    );

CREATE POLICY user_roles_tenant_isolation ON user_roles
    FOR ALL USING (
        tenant_user_id IN (
            SELECT id FROM tenant_users WHERE tenant_id IN (
                SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
            )
        )
    );

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE(permission_code TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT rp.permission_code
    FROM user_roles ur
    JOIN tenant_users tu ON ur.tenant_user_id = tu.id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE tu.user_id = p_user_id
    AND tu.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
