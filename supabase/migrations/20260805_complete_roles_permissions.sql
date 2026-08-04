-- Complete roles/permissions setup (run after roles table exists with all columns)

-- Create permissions table if not exists
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    module TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create role_permissions junction table if not exists
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_code)
);

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, tenant_id, role_id)
);

-- Insert default permissions
INSERT INTO permissions (code, name, description, module) VALUES
('dashboard.view', 'View Dashboard', 'Access the main dashboard', 'dashboard'),
('dashboard.manage', 'Manage Dashboard', 'Customize dashboard widgets', 'dashboard'),
('associations.view', 'View Associations', 'View association details', 'associations'),
('associations.create', 'Create Associations', 'Create new associations', 'associations'),
('associations.edit', 'Edit Associations', 'Edit association details', 'associations'),
('associations.delete', 'Delete Associations', 'Delete associations', 'associations'),
('properties.view', 'View Properties', 'View property details', 'properties'),
('properties.create', 'Create Properties', 'Create new properties', 'properties'),
('properties.edit', 'Edit Properties', 'Edit property details', 'properties'),
('properties.delete', 'Delete Properties', 'Delete properties', 'properties'),
('units.view', 'View Units', 'View unit details', 'units'),
('units.create', 'Create Units', 'Create new units', 'units'),
('units.edit', 'Edit Units', 'Edit unit details', 'units'),
('units.delete', 'Delete Units', 'Delete units', 'units'),
('people.view', 'View People', 'View contact details', 'people'),
('people.create', 'Create People', 'Create new contacts', 'people'),
('people.edit', 'Edit People', 'Edit contact details', 'people'),
('people.delete', 'Delete People', 'Delete contacts', 'people'),
('vendors.view', 'View Vendors', 'View vendor details', 'vendors'),
('vendors.create', 'Create Vendors', 'Create new vendors', 'vendors'),
('vendors.edit', 'Edit Vendors', 'Edit vendor details', 'vendors'),
('vendors.delete', 'Delete Vendors', 'Delete vendors', 'vendors'),
('maintenance.view', 'View Maintenance', 'View maintenance requests', 'maintenance'),
('maintenance.create', 'Create Maintenance', 'Create maintenance requests', 'maintenance'),
('maintenance.edit', 'Edit Maintenance', 'Edit maintenance requests', 'maintenance'),
('maintenance.delete', 'Delete Maintenance', 'Delete maintenance requests', 'maintenance'),
('maintenance.approve', 'Approve Maintenance', 'Approve maintenance requests', 'maintenance'),
('inspections.view', 'View Inspections', 'View inspections', 'inspections'),
('inspections.create', 'Create Inspections', 'Create new inspections', 'inspections'),
('inspections.edit', 'Edit Inspections', 'Edit inspections', 'inspections'),
('inspections.delete', 'Delete Inspections', 'Delete inspections', 'inspections'),
('documents.view', 'View Documents', 'View documents', 'documents'),
('documents.create', 'Create Documents', 'Upload documents', 'documents'),
('documents.edit', 'Edit Documents', 'Edit document metadata', 'documents'),
('documents.delete', 'Delete Documents', 'Delete documents', 'documents'),
('approvals.view', 'View Approvals', 'View approval requests', 'approvals'),
('approvals.create', 'Create Approvals', 'Create approval requests', 'approvals'),
('approvals.vote', 'Vote on Approvals', 'Vote on approval requests', 'approvals'),
('approvals.manage', 'Manage Approvals', 'Manage approval workflow', 'approvals'),
('compliance.view', 'View Compliance', 'View compliance items', 'compliance'),
('compliance.create', 'Create Compliance', 'Create compliance items', 'compliance'),
('compliance.edit', 'Edit Compliance', 'Edit compliance items', 'compliance'),
('compliance.delete', 'Delete Compliance', 'Delete compliance items', 'compliance'),
('payments.view', 'View Payments', 'View payments', 'payments'),
('payments.create', 'Create Payments', 'Record payments', 'payments'),
('payments.edit', 'Edit Payments', 'Edit payments', 'payments'),
('payments.delete', 'Delete Payments', 'Delete payments', 'payments'),
('payments.refund', 'Refund Payments', 'Process refunds', 'payments'),
('communications.view', 'View Communications', 'View messages and announcements', 'communications'),
('communications.create', 'Create Communications', 'Send messages and announcements', 'communications'),
('communications.edit', 'Edit Communications', 'Edit communications', 'communications'),
('communications.delete', 'Delete Communications', 'Delete communications', 'communications'),
('reports.view', 'View Reports', 'View reports', 'reports'),
('reports.create', 'Create Reports', 'Create custom reports', 'reports'),
('reports.export', 'Export Reports', 'Export report data', 'reports'),
('settings.view', 'View Settings', 'View settings', 'settings'),
('settings.edit', 'Edit Settings', 'Edit settings', 'settings'),
('admin.users.manage', 'Manage Users', 'Manage system users', 'admin'),
('admin.roles.manage', 'Manage Roles', 'Manage roles and permissions', 'admin'),
('admin.tenants.manage', 'Manage Tenants', 'Manage tenants', 'admin'),
('admin.system.settings', 'System Settings', 'Manage system settings', 'admin')
ON CONFLICT (code) DO NOTHING;

-- Insert system roles (global roles with NULL tenant_id)
INSERT INTO roles (name, description, is_system_role, is_active, tenant_id) VALUES
('Admin User', 'Full portal administrative access', true, true, NULL),
('Portfolio Manager', 'Assigned Portfolio Operations and Management', true, true, NULL),
('Association Manager', 'Assigned Association Management', true, true, NULL),
('Property Manager', 'Assigned Property Management', true, true, NULL),
('Board Member', 'Assigned Board view and approvals', true, true, NULL),
('Vendor Contractor', 'Assigned Vendor Jobs', true, true, NULL),
('Resident', 'Own associated records', true, true, NULL),
('Owner', 'Own associated records', true, true, NULL),
('Staff', 'Standard User Access', true, true, NULL),
('Finance User', 'Financial Access Only', true, true, NULL)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission_code);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS roles_tenant_isolation ON roles;
DROP POLICY IF EXISTS permissions_read_all ON permissions;
DROP POLICY IF EXISTS role_permissions_tenant_isolation ON role_permissions;
DROP POLICY IF EXISTS user_roles_tenant_isolation ON user_roles;

-- RLS Policies
CREATE POLICY roles_tenant_isolation ON roles
    FOR ALL USING (
        tenant_id IS NULL
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
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE(permission_code TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT rp.permission_code
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = p_user_id
    AND ur.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get effective permissions (combines user_roles with default tenant role)
CREATE OR REPLACE FUNCTION get_user_effective_permissions(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE(permission_code TEXT) AS $$
DECLARE
    v_role TEXT;
    v_has_custom_roles BOOLEAN;
BEGIN
    -- Check if user has custom roles
    SELECT EXISTS(
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id AND tenant_id = p_tenant_id
    ) INTO v_has_custom_roles;
    
    -- If custom roles exist, use those permissions
    IF v_has_custom_roles THEN
        RETURN QUERY
        SELECT rp.permission_code
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        WHERE ur.user_id = p_user_id
        AND ur.tenant_id = p_tenant_id;
    ELSE
        -- Fall back to default tenant role
        SELECT tu.role INTO v_role
        FROM tenant_users tu
        WHERE tu.user_id = p_user_id
        AND tu.tenant_id = p_tenant_id
        LIMIT 1;
        
        IF v_role = 'admin' THEN
            RETURN QUERY SELECT p.code FROM permissions p WHERE p.module != 'admin';
        ELSE
            RETURN QUERY SELECT p.code FROM permissions p 
            WHERE p.module IN ('dashboard', 'maintenance', 'documents', 'communications');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
