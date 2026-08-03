-- Phase 1: Platform Tables Migration
-- Multi-Tenant Platform Architecture Implementation
-- Date: August 3, 2026
-- 
-- This migration creates the foundational platform tables for multi-tenancy
-- WITHOUT modifying existing tables (safe to run, no data impact)

-- ============================================
-- 1. TENANTS TABLE (rename from businesses concept)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'suspended', 'cancelled')),
    
    -- Branding & Localization
    branding JSONB DEFAULT '{}',
    timezone TEXT DEFAULT 'America/Chicago',
    locale TEXT DEFAULT 'en-US',
    
    -- Contact
    primary_email TEXT,
    primary_phone TEXT,
    billing_email TEXT,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. TENANT USERS (rename from business_users)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    is_primary_admin BOOLEAN DEFAULT false,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Plan configuration
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_plans_code ON plans(code);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);

-- Seed initial plans
INSERT INTO plans (code, name, description, display_order) VALUES
    ('starter', 'Starter', 'Perfect for small property management companies just getting started', 1),
    ('professional', 'Professional', 'For growing businesses with multiple associations', 2),
    ('growth', 'Growth', 'Advanced features for established property managers', 3),
    ('enterprise', 'Enterprise', 'Custom solutions for large organizations (by request)', 4)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. FEATURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    
    -- Default limits
    default_limit INTEGER, -- NULL = unlimited
    
    -- Display
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_features_code ON features(code);
CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);

-- Seed core features
INSERT INTO features (code, name, description, category, default_limit, display_order) VALUES
    ('core.associations', 'Associations', 'Number of associations managed', 'core', 5, 1),
    ('core.properties', 'Properties', 'Number of properties', 'core', NULL, 2),
    ('core.units', 'Units', 'Number of units', 'core', NULL, 3),
    ('core.people', 'People', 'Number of contacts/people', 'core', NULL, 4),
    ('core.portfolios', 'Portfolios', 'Number of portfolios', 'core', 1, 5),
    ('maintenance.basic', 'Basic Maintenance', 'Basic maintenance request management', 'maintenance', NULL, 10),
    ('maintenance.advanced', 'Advanced Maintenance', 'Advanced maintenance with vendor quotes', 'maintenance', NULL, 11),
    ('inspections', 'Inspections', 'Property inspections', 'operations', NULL, 20),
    ('documents.library', 'Document Library', 'Document storage and management', 'operations', NULL, 21),
    ('compliance', 'Compliance', 'Compliance tracking', 'operations', NULL, 22),
    ('vendor_portal', 'Vendor Portal', 'Vendor access portal', 'portals', NULL, 30),
    ('board_portal', 'Board Portal', 'Board member portal', 'portals', NULL, 31),
    ('owner_portal', 'Owner Portal', 'Owner/resident portal', 'portals', NULL, 32),
    ('payments', 'Payments', 'Online payment processing', 'financial', NULL, 40),
    ('reports.standard', 'Standard Reports', 'Standard reporting', 'reports', NULL, 50),
    ('reports.advanced', 'Advanced Reports', 'Advanced analytics and reporting', 'reports', NULL, 51),
    ('ghl.automation', 'GHL Automation', 'GoHighLevel integration', 'integrations', NULL, 60),
    ('api.access', 'API Access', 'Programmatic API access', 'integrations', NULL, 61)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. PLAN FEATURES (default entitlements)
-- ============================================
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    
    is_enabled BOOLEAN DEFAULT false,
    limit_value INTEGER, -- NULL = use feature.default_limit
    
    UNIQUE(plan_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature ON plan_features(feature_id);

-- Seed plan features for Starter
DO $$
DECLARE
    starter_id UUID;
    prof_id UUID;
    growth_id UUID;
BEGIN
    SELECT id INTO starter_id FROM plans WHERE code = 'starter';
    SELECT id INTO prof_id FROM plans WHERE code = 'professional';
    SELECT id INTO growth_id FROM plans WHERE code = 'growth';
    
    -- Starter plan features
    INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
    SELECT starter_id, f.id, true, 
        CASE f.code
            WHEN 'core.associations' THEN 5
            WHEN 'core.portfolios' THEN 1
            ELSE f.default_limit
        END
    FROM features f
    WHERE f.code IN ('core.associations', 'core.properties', 'core.units', 'core.people', 'core.portfolios',
                     'maintenance.basic', 'inspections', 'documents.library', 
                     'owner_portal', 'reports.standard')
    ON CONFLICT DO NOTHING;
    
    -- Professional plan features
    INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
    SELECT prof_id, f.id, true,
        CASE f.code
            WHEN 'core.associations' THEN 15
            WHEN 'core.portfolios' THEN 1
            ELSE f.default_limit
        END
    FROM features f
    WHERE f.code IN ('core.associations', 'core.properties', 'core.units', 'core.people', 'core.portfolios',
                     'maintenance.basic', 'maintenance.advanced', 'inspections', 'documents.library', 
                     'compliance', 'vendor_portal', 'board_portal', 'owner_portal',
                     'payments', 'reports.standard', 'reports.advanced', 'ghl.automation')
    ON CONFLICT DO NOTHING;
    
    -- Growth plan features (all enabled)
    INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
    SELECT growth_id, f.id, true, NULL
    FROM features f
    ON CONFLICT DO NOTHING;
END $$;

ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. TENANT SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    
    -- Subscription status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'suspended')),
    
    -- Billing reference (GHL subscription ID)
    billing_reference TEXT,
    billing_customer_id TEXT,
    
    -- Dates
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cancellation_date DATE,
    trial_ends_at TIMESTAMPTZ,
    grace_period_ends_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);

ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. TENANT ENTITLEMENTS (add-ons, overrides)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    
    entitlement_type TEXT NOT NULL CHECK (entitlement_type IN ('addon', 'override', 'trial')),
    is_enabled BOOLEAN DEFAULT true,
    limit_value INTEGER,
    
    -- Effective dates
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiration_date DATE,
    
    -- Reason/approval
    reason TEXT,
    granted_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, feature_id, entitlement_type, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_tenant_entitlements_tenant ON tenant_entitlements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_entitlements_feature ON tenant_entitlements(feature_id);
CREATE INDEX IF NOT EXISTS idx_tenant_entitlements_dates ON tenant_entitlements(effective_date, expiration_date);

ALTER TABLE tenant_entitlements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. PORTFOLIOS
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_portfolios_tenant ON portfolios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_default ON portfolios(tenant_id, is_default) WHERE is_default = true;

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. PORTFOLIO USER ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_user_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    role TEXT NOT NULL DEFAULT 'MANAGER' CHECK (role IN ('MANAGER', 'VIEWER')),
    
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(portfolio_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_assignments_portfolio ON portfolio_user_assignments(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_assignments_user ON portfolio_user_assignments(user_id);

ALTER TABLE portfolio_user_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. ASSOCIATION GHL CONNECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS association_ghl_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    
    -- GHL Location mapping (non-secret)
    ghl_location_id TEXT NOT NULL,
    ghl_company_id TEXT,
    ghl_location_name TEXT,
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    sync_enabled BOOLEAN DEFAULT true,
    webhook_secret_reference TEXT,  -- Reference to secret manager, not the secret
    
    -- Sync settings
    sync_settings JSONB DEFAULT '{}',
    
    -- Status
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT,
    last_error TEXT,
    
    -- Metadata
    connected_by UUID REFERENCES auth.users(id),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ,
    disconnect_reason TEXT,
    
    UNIQUE(association_id)
);

CREATE INDEX IF NOT EXISTS idx_ghl_conn_association ON association_ghl_connections(association_id);
CREATE INDEX IF NOT EXISTS idx_ghl_conn_location ON association_ghl_connections(ghl_location_id);

ALTER TABLE association_ghl_connections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. ASSOCIATION FINANCIAL CONNECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS association_financial_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    
    -- Financial system type
    provider TEXT NOT NULL CHECK (provider IN (
        'quickbooks_online',
        'quickbooks_desktop',
        'xero',
        'sage',
        'appfolio',
        'buildium',
        'stripe',
        'custom'
    )),
    
    -- External reference (non-secret)
    external_account_id TEXT,
    external_account_name TEXT,
    
    -- Configuration
    import_enabled BOOLEAN DEFAULT false,
    import_schedule TEXT,
    last_import_at TIMESTAMPTZ,
    last_import_status TEXT,
    
    -- Permissions
    allowed_sync_directions TEXT[] DEFAULT ARRAY['inbound'],
    allowed_data_types TEXT[] DEFAULT ARRAY['transactions', 'balances'],
    
    -- Secret reference (actual credentials in secret manager)
    credentials_reference TEXT,
    
    -- Metadata
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    connected_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(association_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_financial_conn_association ON association_financial_connections(association_id);
CREATE INDEX IF NOT EXISTS idx_financial_conn_provider ON association_financial_connections(provider);

ALTER TABLE association_financial_connections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. PLATFORM AUDIT EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS platform_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    actor_type TEXT NOT NULL DEFAULT 'platform_admin' CHECK (actor_type IN ('platform_admin', 'platform_support', 'system')),
    
    -- Target tenant (if applicable)
    tenant_id UUID REFERENCES tenants(id),
    
    -- Action details
    action TEXT NOT NULL,
    action_category TEXT NOT NULL CHECK (action_category IN ('tenant', 'plan', 'entitlement', 'support', 'integration', 'security')),
    
    -- Target record
    target_type TEXT,
    target_id TEXT,
    
    -- Change details
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    correlation_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_actor ON platform_audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_tenant ON platform_audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_action ON platform_audit_events(action_category, action);
CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON platform_audit_events(created_at);

ALTER TABLE platform_audit_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. SUPPORT ACCESS SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS support_access_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Platform support user
    platform_user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Target tenant
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Session details
    reason TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 minutes'),
    
    -- Actions taken
    actions_count INTEGER DEFAULT 0,
    last_action_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_sessions_platform_user ON support_access_sessions(platform_user_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_tenant ON support_access_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_active ON support_access_sessions(platform_user_id, tenant_id, is_active) WHERE is_active = true;

ALTER TABLE support_access_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR PLATFORM TABLES
-- ============================================

-- Tenants: Platform Admins see all, tenant admins see their own
CREATE POLICY tenants_platform_admin ON tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

CREATE POLICY tenants_tenant_admin ON tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tenant_users 
            WHERE tenant_id = tenants.id 
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Tenant Users: Platform admins see all, tenant members see their tenant
CREATE POLICY tenant_users_platform_admin ON tenant_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

CREATE POLICY tenant_users_tenant_member ON tenant_users
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
    );

-- Plans: Public read for all authenticated
CREATE POLICY plans_public_read ON plans
    FOR SELECT USING (is_active = true);

CREATE POLICY plans_platform_admin ON plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

-- Features: Public read
CREATE POLICY features_public_read ON features
    FOR SELECT USING (is_active = true);

CREATE POLICY features_platform_admin ON features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

-- Plan Features: Public read
CREATE POLICY plan_features_public_read ON plan_features
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM plans 
            WHERE id = plan_features.plan_id 
            AND is_active = true
        )
    );

CREATE POLICY plan_features_platform_admin ON plan_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

-- Tenant Subscriptions: Platform admins see all, tenant admins see their own
CREATE POLICY tenant_subscriptions_platform_admin ON tenant_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

CREATE POLICY tenant_subscriptions_tenant_admin ON tenant_subscriptions
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Tenant Entitlements: Platform admins manage, tenant admins view
CREATE POLICY tenant_entitlements_platform_admin ON tenant_entitlements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

CREATE POLICY tenant_entitlements_tenant_admin ON tenant_entitlements
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Portfolios: Tenant members see their tenant's portfolios
CREATE POLICY portfolios_tenant_member ON portfolios
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

-- Portfolio User Assignments: Portfolio managers and tenant admins
CREATE POLICY portfolio_assignments_manager ON portfolio_user_assignments
    FOR ALL USING (
        portfolio_id IN (
            SELECT p.id FROM portfolios p
            JOIN tenant_users tu ON tu.tenant_id = p.tenant_id
            WHERE tu.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

-- Association GHL Connections: Tenant members
CREATE POLICY ghl_connections_tenant_member ON association_ghl_connections
    FOR ALL USING (
        association_id IN (
            SELECT a.id FROM associations a
            JOIN portfolios p ON p.id = a.portfolio_id
            JOIN tenant_users tu ON tu.tenant_id = p.tenant_id
            WHERE tu.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

-- Association Financial Connections: Tenant members
CREATE POLICY financial_connections_tenant_member ON association_financial_connections
    FOR ALL USING (
        association_id IN (
            SELECT a.id FROM associations a
            JOIN portfolios p ON p.id = a.portfolio_id
            JOIN tenant_users tu ON tu.tenant_id = p.tenant_id
            WHERE tu.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
        )
    );

-- Platform Audit Events: Platform admins only
CREATE POLICY platform_audit_platform_admin ON platform_audit_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
        )
    );

-- Support Access Sessions: Platform admins and the support user
CREATE POLICY support_sessions_platform_admin ON support_access_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
        )
    );

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to get current tenant ID from JWT
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
    tenant_id := (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID;
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'PLATFORM_ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is platform support
CREATE OR REPLACE FUNCTION is_platform_support()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active support session for tenant
CREATE OR REPLACE FUNCTION has_active_support_session(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM support_access_sessions
        WHERE platform_user_id = auth.uid()
        AND tenant_id = p_tenant_id
        AND is_active = true
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    'platform_tables_created',
    'tenant',
    'migration',
    '20260803_phase1_platform_tables',
    'Phase 1: Platform tables migration completed',
    jsonb_build_object(
        'tables_created', ARRAY[
            'tenants', 'tenant_users', 'plans', 'features', 'plan_features',
            'tenant_subscriptions', 'tenant_entitlements', 'portfolios',
            'portfolio_user_assignments', 'association_ghl_connections',
            'association_financial_connections', 'platform_audit_events',
            'support_access_sessions'
        ],
        'timestamp', NOW()
    )
WHERE auth.uid() IS NOT NULL;
