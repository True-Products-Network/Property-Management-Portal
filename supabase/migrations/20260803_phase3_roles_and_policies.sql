-- Phase 3: Roles and Authorization Policies
-- Multi-Tenant Platform Architecture Implementation
-- Date: August 3, 2026
--
-- This migration:
-- 1. Adds PLATFORM_ADMIN and PLATFORM_SUPPORT roles
-- 2. Updates existing role assignments
-- 3. Creates comprehensive authorization policies
-- 4. Adds role hierarchy and permission checks

-- ============================================
-- STEP 1: Add new role types to existing enums
-- ============================================

-- Add platform roles to user_roles table
-- Note: We need to handle the enum carefully

DO $$
BEGIN
    -- Check if we need to add platform roles
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PLATFORM_ADMIN' 
        AND enumtypid = 'portal_role'::regtype
    ) THEN
        -- Add platform roles to the enum
        ALTER TYPE portal_role ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';
        ALTER TYPE portal_role ADD VALUE IF NOT EXISTS 'PLATFORM_SUPPORT';
    END IF;
END $$;

-- ============================================
-- STEP 2: Create role_permissions table
-- ============================================

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    is_allowed BOOLEAN DEFAULT true,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(role, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);

-- Seed role permissions
INSERT INTO role_permissions (role, resource, action, is_allowed) VALUES
    -- Platform Admin (True Products Network)
    ('PLATFORM_ADMIN', '*', '*', true),
    
    -- Platform Support (Audited access)
    ('PLATFORM_SUPPORT', 'tenants', 'read', true),
    ('PLATFORM_SUPPORT', 'tenant_subscriptions', 'read', true),
    ('PLATFORM_SUPPORT', 'platform_audit_events', 'read', true),
    ('PLATFORM_SUPPORT', 'support_access_sessions', 'create', true),
    ('PLATFORM_SUPPORT', 'associations', 'read', true),
    ('PLATFORM_SUPPORT', 'contacts', 'read', true),
    ('PLATFORM_SUPPORT', 'maintenance_requests', 'read', true),
    
    -- Business Admin (Tenant-wide admin)
    ('ADMIN_USER', 'tenant_users', 'manage', true),
    ('ADMIN_USER', 'portfolios', 'manage', true),
    ('ADMIN_USER', 'associations', 'manage', true),
    ('ADMIN_USER', 'tenant_settings', 'manage', true),
    ('ADMIN_USER', 'tenant_subscriptions', 'read', true),
    ('ADMIN_USER', 'contacts', 'manage', true),
    ('ADMIN_USER', 'properties', 'manage', true),
    ('ADMIN_USER', 'units', 'manage', true),
    ('ADMIN_USER', 'vendors', 'manage', true),
    ('ADMIN_USER', 'maintenance_requests', 'manage', true),
    ('ADMIN_USER', 'inspections', 'manage', true),
    ('ADMIN_USER', 'documents', 'manage', true),
    ('ADMIN_USER', 'compliance', 'manage', true),
    ('ADMIN_USER', 'approvals', 'manage', true),
    ('ADMIN_USER', 'payments', 'manage', true),
    ('ADMIN_USER', 'communications', 'manage', true),
    ('ADMIN_USER', 'reports', 'read', true),
    
    -- Portfolio Manager
    ('PORTFOLIO_MANAGER', 'portfolios', 'read', true),
    ('PORTFOLIO_MANAGER', 'portfolios', 'update', true),
    ('PORTFOLIO_MANAGER', 'associations', 'create', true),
    ('PORTFOLIO_MANAGER', 'associations', 'read', true),
    ('PORTFOLIO_MANAGER', 'associations', 'update', true),
    ('PORTFOLIO_MANAGER', 'associations', 'delete', true),
    ('PORTFOLIO_MANAGER', 'contacts', 'manage', true),
    ('PORTFOLIO_MANAGER', 'properties', 'manage', true),
    ('PORTFOLIO_MANAGER', 'units', 'manage', true),
    ('PORTFOLIO_MANAGER', 'vendors', 'manage', true),
    ('PORTFOLIO_MANAGER', 'maintenance_requests', 'manage', true),
    ('PORTFOLIO_MANAGER', 'inspections', 'manage', true),
    ('PORTFOLIO_MANAGER', 'documents', 'manage', true),
    ('PORTFOLIO_MANAGER', 'compliance', 'manage', true),
    ('PORTFOLIO_MANAGER', 'approvals', 'read', true),
    ('PORTFOLIO_MANAGER', 'reports', 'read', true),
    
    -- Property Manager
    ('MANAGEMENT_STAFF', 'associations', 'read', true),
    ('MANAGEMENT_STAFF', 'contacts', 'manage', true),
    ('MANAGEMENT_STAFF', 'properties', 'manage', true),
    ('MANAGEMENT_STAFF', 'units', 'manage', true),
    ('MANAGEMENT_STAFF', 'vendors', 'manage', true),
    ('MANAGEMENT_STAFF', 'maintenance_requests', 'manage', true),
    ('MANAGEMENT_STAFF', 'inspections', 'manage', true),
    ('MANAGEMENT_STAFF', 'documents', 'manage', true),
    ('MANAGEMENT_STAFF', 'compliance', 'manage', true),
    ('MANAGEMENT_STAFF', 'reports', 'read', true),
    
    -- Board Member
    ('BOARD_MEMBER', 'associations', 'read', true),
    ('BOARD_MEMBER', 'contacts', 'read', true),
    ('BOARD_MEMBER', 'maintenance_requests', 'read', true),
    ('BOARD_MEMBER', 'inspections', 'read', true),
    ('BOARD_MEMBER', 'documents', 'read', true),
    ('BOARD_MEMBER', 'compliance', 'read', true),
    ('BOARD_MEMBER', 'approvals', 'manage', true),
    ('BOARD_MEMBER', 'reports', 'read', true),
    
    -- Owner
    ('OWNER', 'associations', 'read', true),
    ('OWNER', 'contacts', 'read', true),
    ('OWNER', 'properties', 'read', true),
    ('OWNER', 'units', 'read', true),
    ('OWNER', 'maintenance_requests', 'create', true),
    ('OWNER', 'maintenance_requests', 'read', true),
    ('OWNER', 'documents', 'read', true),
    ('OWNER', 'payments', 'create', true),
    
    -- Resident
    ('RESIDENT', 'units', 'read', true),
    ('RESIDENT', 'maintenance_requests', 'create', true),
    ('RESIDENT', 'maintenance_requests', 'read', true),
    ('RESIDENT', 'documents', 'read', true),
    
    -- Vendor
    ('VENDOR', 'vendors', 'read', true),
    ('VENDOR', 'maintenance_requests', 'read', true),
    ('VENDOR', 'maintenance_requests', 'update', true)
ON CONFLICT (role, resource, action) DO NOTHING;

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Migrate existing ADMIN_USER roles
-- ============================================

-- Update existing ADMIN_USER roles to be scoped to their tenant
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM tenants WHERE code = 'exemplary-services';
    
    -- Ensure all ADMIN_USERs are also tenant admins
    INSERT INTO tenant_users (tenant_id, user_id, role, is_primary_admin)
    SELECT 
        default_tenant_id,
        ur.user_id,
        'admin',
        true
    FROM user_roles ur
    WHERE ur.role = 'ADMIN_USER'
    AND NOT EXISTS (
        SELECT 1 FROM tenant_users tu 
        WHERE tu.tenant_id = default_tenant_id 
        AND tu.user_id = ur.user_id
    )
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Migrated ADMIN_USER roles to tenant_users';
END $$;

-- ============================================
-- STEP 4: Create user_roles_v2 table with better structure
-- ============================================

CREATE TABLE IF NOT EXISTS user_roles_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role type
    role_type TEXT NOT NULL CHECK (role_type IN (
        'PLATFORM_ADMIN',
        'PLATFORM_SUPPORT',
        'BUSINESS_ADMIN',
        'PORTFOLIO_MANAGER',
        'PROPERTY_MANAGER',
        'ASSOCIATION_MANAGER',
        'BOOKKEEPER',
        'BOARD_MEMBER',
        'OWNER',
        'RESIDENT',
        'VENDOR'
    )),
    
    -- Scope (at least one must be set for non-platform roles)
    tenant_id UUID REFERENCES tenants(id),
    portfolio_id UUID REFERENCES portfolios(id),
    association_id UUID REFERENCES associations(id),
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    vendor_id UUID REFERENCES vendors(id),
    
    -- Metadata
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    is_primary BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_v2_user ON user_roles_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_role ON user_roles_v2(role_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_tenant ON user_roles_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_portfolio ON user_roles_v2(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_association ON user_roles_v2(association_id);

ALTER TABLE user_roles_v2 ENABLE ROW LEVEL SECURITY;

-- Migrate existing roles to v2
DO $$
DECLARE
    default_tenant_id UUID;
    default_portfolio_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM tenants WHERE code = 'exemplary-services';
    SELECT id INTO default_portfolio_id FROM portfolios 
    WHERE tenant_id = default_tenant_id AND is_default = true;
    
    -- Migrate ADMIN_USER to BUSINESS_ADMIN
    INSERT INTO user_roles_v2 (user_id, role_type, tenant_id, portfolio_id, is_primary)
    SELECT 
        ur.user_id,
        'BUSINESS_ADMIN',
        default_tenant_id,
        default_portfolio_id,
        true
    FROM user_roles ur
    WHERE ur.role = 'ADMIN_USER'
    ON CONFLICT DO NOTHING;
    
    -- Migrate MANAGEMENT_STAFF to PROPERTY_MANAGER
    INSERT INTO user_roles_v2 (user_id, role_type, tenant_id, portfolio_id, association_id, is_primary)
    SELECT 
        ur.user_id,
        'PROPERTY_MANAGER',
        default_tenant_id,
        default_portfolio_id,
        ur.association_id::UUID,
        false
    FROM user_roles ur
    WHERE ur.role = 'MANAGEMENT_STAFF'
    ON CONFLICT DO NOTHING;
    
    -- Migrate other roles
    INSERT INTO user_roles_v2 (user_id, role_type, tenant_id, portfolio_id, association_id, is_primary)
    SELECT 
        ur.user_id,
        CASE ur.role
            WHEN 'BOARD_MEMBER' THEN 'BOARD_MEMBER'
            WHEN 'OWNER' THEN 'OWNER'
            WHEN 'RESIDENT' THEN 'RESIDENT'
            WHEN 'VENDOR' THEN 'VENDOR'
            ELSE 'PROPERTY_MANAGER'
        END,
        default_tenant_id,
        default_portfolio_id,
        ur.association_id::UUID,
        false
    FROM user_roles ur
    WHERE ur.role NOT IN ('ADMIN_USER', 'MANAGEMENT_STAFF')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Migrated roles to user_roles_v2';
END $$;

-- ============================================
-- STEP 5: Create authorization helper functions
-- ============================================

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    -- Check for wildcard permission (PLATFORM_ADMIN)
    SELECT EXISTS (
        SELECT 1 FROM role_permissions
        WHERE role IN (
            SELECT role_type FROM user_roles_v2 
            WHERE user_id = p_user_id 
            AND revoked_at IS NULL
        )
        AND resource = '*'
        AND action = '*'
        AND is_allowed = true
    ) INTO has_perm;
    
    IF has_perm THEN
        RETURN true;
    END IF;
    
    -- Check specific permission
    SELECT EXISTS (
        SELECT 1 FROM role_permissions
        WHERE role IN (
            SELECT role_type FROM user_roles_v2 
            WHERE user_id = p_user_id 
            AND revoked_at IS NULL
        )
        AND resource = p_resource
        AND action = p_action
        AND is_allowed = true
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access specific tenant
CREATE OR REPLACE FUNCTION can_access_tenant(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles_v2
        WHERE user_id = p_user_id
        AND tenant_id = p_tenant_id
        AND revoked_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM user_roles_v2
        WHERE user_id = p_user_id
        AND role_type IN ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
        AND revoked_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM support_access_sessions
        WHERE platform_user_id = p_user_id
        AND tenant_id = p_tenant_id
        AND is_active = true
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access specific portfolio
CREATE OR REPLACE FUNCTION can_access_portfolio(
    p_user_id UUID,
    p_portfolio_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles_v2
        WHERE user_id = p_user_id
        AND portfolio_id = p_portfolio_id
        AND revoked_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM user_roles_v2 ur
        JOIN portfolios p ON p.tenant_id = ur.tenant_id
        WHERE ur.user_id = p_user_id
        AND p.id = p_portfolio_id
        AND ur.role_type = 'BUSINESS_ADMIN'
        AND ur.revoked_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM user_roles_v2
        WHERE user_id = p_user_id
        AND role_type IN ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
        AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access specific association
CREATE OR REPLACE FUNCTION can_access_association(
    p_user_id UUID,
    p_association_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tenant_id UUID;
    v_portfolio_id UUID;
BEGIN
    -- Get association's tenant and portfolio
    SELECT a.tenant_id, a.portfolio_id 
    INTO v_tenant_id, v_portfolio_id
    FROM associations a
    WHERE a.id = p_association_id;
    
    RETURN EXISTS (
        SELECT 1 FROM user_roles_v2
        WHERE user_id = p_user_id
        AND association_id = p_association_id
        AND revoked_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM user_roles_v2
        WHERE user_id = p_user_id
        AND portfolio_id = v_portfolio_id
        AND role_type IN ('PORTFOLIO_MANAGER', 'BUSINESS_ADMIN')
        AND revoked_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM user_roles_v2
        WHERE user_id = p_user_id
        AND tenant_id = v_tenant_id
        AND role_type = 'BUSINESS_ADMIN'
        AND revoked_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM user_roles_v2
        WHERE user_id = p_user_id
        AND role_type IN ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
        AND revoked_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM support_access_sessions
        WHERE platform_user_id = p_user_id
        AND tenant_id = v_tenant_id
        AND is_active = true
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's effective roles for a tenant
CREATE OR REPLACE FUNCTION get_user_roles_for_tenant(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS TABLE (role_type TEXT, portfolio_id UUID, association_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.role_type,
        ur.portfolio_id,
        ur.association_id
    FROM user_roles_v2 ur
    WHERE ur.user_id = p_user_id
    AND ur.tenant_id = p_tenant_id
    AND ur.revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: Update RLS policies to use new authorization
-- ============================================

-- Update associations policy to check portfolio access
DROP POLICY IF EXISTS associations_tenant_isolation ON associations;

CREATE POLICY associations_access_control ON associations
    FOR ALL USING (
        can_access_association(auth.uid(), id)
    );

-- Update portfolios policy
DROP POLICY IF EXISTS portfolios_tenant_member ON portfolios;

CREATE POLICY portfolios_access_control ON portfolios
    FOR ALL USING (
        can_access_portfolio(auth.uid(), id)
    );

-- Update tenant_users policy
DROP POLICY IF EXISTS tenant_users_tenant_member ON tenant_users;

CREATE POLICY tenant_users_access_control ON tenant_users
    FOR SELECT USING (
        can_access_tenant(auth.uid(), tenant_id)
    );

-- ============================================
-- STEP 7: Create triggers for audit logging
-- ============================================

-- Trigger function to log role changes
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO platform_audit_events (
            actor_id,
            actor_type,
            action,
            action_category,
            target_type,
            target_id,
            new_value
        )
        SELECT 
            auth.uid(),
            CASE 
                WHEN is_platform_admin() THEN 'platform_admin'
                ELSE 'system'
            END,
            'role_granted',
            'security',
            'user_role',
            NEW.id::TEXT,
            jsonb_build_object(
                'user_id', NEW.user_id,
                'role_type', NEW.role_type,
                'tenant_id', NEW.tenant_id,
                'portfolio_id', NEW.portfolio_id,
                'association_id', NEW.association_id
            );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL THEN
        INSERT INTO platform_audit_events (
            actor_id,
            actor_type,
            action,
            action_category,
            target_type,
            target_id,
            previous_value,
            new_value
        )
        SELECT 
            auth.uid(),
            CASE 
                WHEN is_platform_admin() THEN 'platform_admin'
                ELSE 'system'
            END,
            'role_revoked',
            'security',
            'user_role',
            NEW.id::TEXT,
            jsonb_build_object(
                'user_id', OLD.user_id,
                'role_type', OLD.role_type,
                'granted_at', OLD.granted_at
            ),
            jsonb_build_object(
                'revoked_at', NEW.revoked_at
            );
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to user_roles_v2
DROP TRIGGER IF EXISTS log_role_changes ON user_roles_v2;
CREATE TRIGGER log_role_changes
    AFTER INSERT OR UPDATE ON user_roles_v2
    FOR EACH ROW
    EXECUTE FUNCTION log_role_change();

-- ============================================
-- STEP 8: Create views for role management
-- ============================================

-- View: User roles with details
CREATE OR REPLACE VIEW user_roles_detail AS
SELECT 
    ur.id,
    ur.user_id,
    ur.role_type,
    ur.tenant_id,
    t.name as tenant_name,
    ur.portfolio_id,
    p.name as portfolio_name,
    ur.association_id,
    a.name as association_name,
    ur.property_id,
    ur.unit_id,
    ur.vendor_id,
    ur.granted_by,
    ur.granted_at,
    ur.revoked_at,
    ur.is_primary,
    CASE 
        WHEN ur.revoked_at IS NOT NULL THEN 'revoked'
        WHEN ur.granted_at > NOW() THEN 'pending'
        ELSE 'active'
    END as status
FROM user_roles_v2 ur
LEFT JOIN tenants t ON t.id = ur.tenant_id
LEFT JOIN portfolios p ON p.id = ur.portfolio_id
LEFT JOIN associations a ON a.id = ur.association_id
WHERE ur.created_at IS NOT NULL;

-- View: Tenant users with roles summary
CREATE OR REPLACE VIEW tenant_users_summary AS
SELECT 
    tu.tenant_id,
    tu.user_id,
    u.email as user_email,
    tu.role as tenant_role,
    tu.is_primary_admin,
    tu.joined_at,
    array_agg(DISTINCT ur.role_type) as all_roles,
    count(DISTINCT ur.id) as role_count
FROM tenant_users tu
JOIN auth.users u ON u.id = tu.user_id
LEFT JOIN user_roles_v2 ur ON ur.user_id = tu.user_id AND ur.revoked_at IS NULL
GROUP BY tu.tenant_id, tu.user_id, u.email, tu.role, tu.is_primary_admin, tu.joined_at;

-- ============================================
-- MIGRATION COMPLETION LOG
-- ============================================

INSERT INTO platform_audit_events (
    actor_id,
    actor_type,
    action,
    action_category,
    target_type,
    target_id,
    reason,
    new_value
)
SELECT 
    auth.uid(),
    'system',
    'phase3_migration_completed',
    'security',
    'migration',
    '20260803_phase3_roles_and_policies',
    'Phase 3: Roles and authorization policies implemented',
    jsonb_build_object(
        'actions', ARRAY[
            'Added PLATFORM_ADMIN and PLATFORM_SUPPORT roles',
            'Created role_permissions table',
            'Migrated existing roles to user_roles_v2',
            'Created authorization helper functions',
            'Updated RLS policies',
            'Created audit logging triggers',
            'Created role management views'
        ],
        'timestamp', NOW()
    )
WHERE auth.uid() IS NOT NULL;
