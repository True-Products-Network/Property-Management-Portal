-- Migration: Create portal_roles and ghl_role_mappings tables
-- Date: 2026-08-02

-- ============================================
-- Portal Roles Table
-- ============================================
CREATE TABLE IF NOT EXISTS portal_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_default BOOLEAN DEFAULT false,
    requires_mfa BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    user_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE portal_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portal_roles
CREATE POLICY "portal_roles_select_policy" ON portal_roles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "portal_roles_insert_policy" ON portal_roles
    FOR INSERT TO authenticated
    WITH CHECK (is_admin_user());

CREATE POLICY "portal_roles_update_policy" ON portal_roles
    FOR UPDATE TO authenticated
    USING (is_admin_user());

CREATE POLICY "portal_roles_delete_policy" ON portal_roles
    FOR DELETE TO authenticated
    USING (is_admin_user());

-- ============================================
-- GHL Role Mappings Table
-- ============================================
CREATE TABLE IF NOT EXISTS ghl_role_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ghl_contact_role TEXT NOT NULL UNIQUE,
    portal_role TEXT NOT NULL,
    portal_version TEXT DEFAULT 'Management',
    default_permissions TEXT,
    requires_mfa BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unknown')),
    description TEXT,
    user_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ghl_role_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ghl_role_mappings
CREATE POLICY "ghl_role_mappings_select_policy" ON ghl_role_mappings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "ghl_role_mappings_insert_policy" ON ghl_role_mappings
    FOR INSERT TO authenticated
    WITH CHECK (is_admin_user());

CREATE POLICY "ghl_role_mappings_update_policy" ON ghl_role_mappings
    FOR UPDATE TO authenticated
    USING (is_admin_user());

CREATE POLICY "ghl_role_mappings_delete_policy" ON ghl_role_mappings
    FOR DELETE TO authenticated
    USING (is_admin_user());

-- ============================================
-- Audit Logs Table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT TO authenticated
    USING (is_admin_user());

CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_portal_roles_status ON portal_roles(status);
CREATE INDEX IF NOT EXISTS idx_portal_roles_name ON portal_roles(name);
CREATE INDEX IF NOT EXISTS idx_ghl_role_mappings_ghl_role ON ghl_role_mappings(ghl_contact_role);
CREATE INDEX IF NOT EXISTS idx_ghl_role_mappings_portal_role ON ghl_role_mappings(portal_role);
CREATE INDEX IF NOT EXISTS idx_ghl_role_mappings_status ON ghl_role_mappings(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- Insert Default Portal Roles
-- ============================================
INSERT INTO portal_roles (name, description, permissions, is_default, requires_mfa, status)
VALUES 
    ('Admin User', 'Full portal administration access', '[
        {"module": "dashboard", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "associations", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "properties", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "units", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "people", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "vendors", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "maintenance", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "inspections", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "documents", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "approvals", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "compliance", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "payments", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "communications", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "reports", "read": true, "write": true, "delete": true, "approve": true},
        {"module": "settings", "read": true, "write": true, "delete": true, "approve": true}
    ]'::jsonb, true, true, 'active'),
    
    ('Management Staff', 'Assigned portfolio operations', '[
        {"module": "dashboard", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "associations", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "properties", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "units", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "people", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "vendors", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "maintenance", "read": true, "write": true, "delete": false, "approve": true},
        {"module": "inspections", "read": true, "write": true, "delete": false, "approve": true},
        {"module": "documents", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "approvals", "read": true, "write": true, "delete": false, "approve": true},
        {"module": "compliance", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "payments", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "communications", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "reports", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "settings", "read": true, "write": false, "delete": false, "approve": false}
    ]'::jsonb, true, true, 'active'),
    
    ('Board Member', 'Assigned Association view and approvals', '[
        {"module": "dashboard", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "associations", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "properties", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "units", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "people", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "vendors", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "maintenance", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "inspections", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "documents", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "approvals", "read": true, "write": false, "delete": false, "approve": true},
        {"module": "compliance", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "payments", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "communications", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "reports", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "settings", "read": false, "write": false, "delete": false, "approve": false}
    ]'::jsonb, true, true, 'active'),
    
    ('Owner', 'Own associated records', '[
        {"module": "dashboard", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "associations", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "properties", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "units", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "people", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "vendors", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "maintenance", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "inspections", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "documents", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "approvals", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "compliance", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "payments", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "communications", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "reports", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "settings", "read": false, "write": false, "delete": false, "approve": false}
    ]'::jsonb, true, false, 'active'),
    
    ('Resident', 'Own associated records', '[
        {"module": "dashboard", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "associations", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "properties", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "units", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "people", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "vendors", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "maintenance", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "inspections", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "documents", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "approvals", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "compliance", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "payments", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "communications", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "reports", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "settings", "read": false, "write": false, "delete": false, "approve": false}
    ]'::jsonb, true, false, 'active'),
    
    ('Vendor Contact', 'Assigned vendor jobs', '[
        {"module": "dashboard", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "associations", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "properties", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "units", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "people", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "vendors", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "maintenance", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "inspections", "read": true, "write": true, "delete": false, "approve": false},
        {"module": "documents", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "approvals", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "compliance", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "payments", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "communications", "read": true, "write": false, "delete": false, "approve": false},
        {"module": "reports", "read": false, "write": false, "delete": false, "approve": false},
        {"module": "settings", "read": false, "write": false, "delete": false, "approve": false}
    ]'::jsonb, true, false, 'active')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Insert Default GHL Role Mappings
-- ============================================
INSERT INTO ghl_role_mappings (ghl_contact_role, portal_role, portal_version, default_permissions, requires_mfa, status, description)
VALUES 
    ('Admin User', 'Admin User', 'Management', 'Full portal administration', true, 'active', 'Full access to all portal features and administration'),
    ('Property Manager', 'Management Staff', 'Management', 'Assigned portfolio operations', true, 'active', 'Manage assigned properties, maintenance, and inspections'),
    ('Board Member', 'Board Member', 'Board', 'Assigned Association view', true, 'active', 'View association data and participate in approvals'),
    ('Board Approver', 'Board Approver', 'Board', 'Assigned approval actions', true, 'active', 'Specialized role for financial and policy approvals'),
    ('Owner', 'Owner', 'Owner / Resident', 'Own associated records', false, 'active', 'Access to own property, unit, and related records'),
    ('Resident', 'Resident', 'Owner / Resident', 'Own associated records', false, 'active', 'Access to own unit and related records'),
    ('Vendor Contact', 'Vendor Contact', 'Vendor', 'Assigned vendor jobs', false, 'active', 'Access to assigned maintenance and inspection jobs'),
    ('Inspector', 'Inspector', 'Vendor or Management', 'Assigned inspections', true, 'active', 'Access to assigned inspections and reports'),
    ('Bookkeeper', 'Restricted Finance', 'Management', 'Approved financial screens only', true, 'active', 'Limited access to financial reports and payment data')
ON CONFLICT (ghl_contact_role) DO NOTHING;

-- ============================================
-- Update Trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portal_roles_updated_at
    BEFORE UPDATE ON portal_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ghl_role_mappings_updated_at
    BEFORE UPDATE ON ghl_role_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
