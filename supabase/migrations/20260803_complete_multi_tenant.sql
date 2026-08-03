-- Complete Multi-Tenant Platform Migration
-- Single file with all phases in correct order
-- Date: August 3, 2026

-- ============================================
-- PHASE 0: Fix enum first (run this before others)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_role') THEN
        CREATE TYPE platform_role AS ENUM ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT');
    END IF;
END $$;

-- ============================================
-- PHASE 1: Platform Tables
-- ============================================

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'suspended', 'cancelled')),
    branding JSONB DEFAULT '{}',
    timezone TEXT DEFAULT 'America/Chicago',
    locale TEXT DEFAULT 'en-US',
    primary_email TEXT,
    primary_phone TEXT,
    billing_email TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenant users
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

-- Plans
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (code, name, description, display_order) VALUES
    ('starter', 'Starter', 'Perfect for small property management companies', 1),
    ('professional', 'Professional', 'For growing businesses with multiple associations', 2),
    ('growth', 'Growth', 'Advanced features for established property managers', 3),
    ('enterprise', 'Enterprise', 'Custom solutions for large organizations', 4)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Features
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    default_limit INTEGER,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO features (code, name, description, category, default_limit, display_order) VALUES
    ('core.associations', 'Associations', 'Number of associations managed', 'core', 5, 1),
    ('core.properties', 'Properties', 'Number of properties', 'core', NULL, 2),
    ('core.units', 'Units', 'Number of units', 'core', NULL, 3),
    ('core.people', 'People', 'Number of contacts', 'core', NULL, 4),
    ('core.portfolios', 'Portfolios', 'Number of portfolios', 'core', 1, 5),
    ('maintenance.basic', 'Basic Maintenance', 'Basic maintenance requests', 'maintenance', NULL, 10),
    ('maintenance.advanced', 'Advanced Maintenance', 'Advanced with vendor quotes', 'maintenance', NULL, 11),
    ('inspections', 'Inspections', 'Property inspections', 'operations', NULL, 20),
    ('documents.library', 'Document Library', 'Document storage', 'operations', NULL, 21),
    ('compliance', 'Compliance', 'Compliance tracking', 'operations', NULL, 22),
    ('vendor_portal', 'Vendor Portal', 'Vendor access', 'portals', NULL, 30),
    ('board_portal', 'Board Portal', 'Board member portal', 'portals', NULL, 31),
    ('owner_portal', 'Owner Portal', 'Owner/resident portal', 'portals', NULL, 32),
    ('payments', 'Payments', 'Online payment processing', 'financial', NULL, 40),
    ('reports.standard', 'Standard Reports', 'Standard reporting', 'reports', NULL, 50),
    ('reports.advanced', 'Advanced Reports', 'Advanced analytics', 'reports', NULL, 51),
    ('ghl.automation', 'GHL Automation', 'GoHighLevel integration', 'integrations', NULL, 60)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Plan features
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false,
    limit_value INTEGER,
    UNIQUE(plan_id, feature_id)
);

ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- Seed plan features
DO $$
DECLARE
    starter_id UUID;
    prof_id UUID;
    growth_id UUID;
BEGIN
    SELECT id INTO starter_id FROM plans WHERE code = 'starter';
    SELECT id INTO prof_id FROM plans WHERE code = 'professional';
    SELECT id INTO growth_id FROM plans WHERE code = 'growth';
    
    IF starter_id IS NOT NULL THEN
        INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
        SELECT starter_id, f.id, true, 
            CASE f.code WHEN 'core.associations' THEN 5 WHEN 'core.portfolios' THEN 1 ELSE f.default_limit END
        FROM features f
        WHERE f.code IN ('core.associations', 'core.properties', 'core.units', 'core.people', 'core.portfolios',
                         'maintenance.basic', 'inspections', 'documents.library', 'owner_portal', 'reports.standard')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF prof_id IS NOT NULL THEN
        INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
        SELECT prof_id, f.id, true,
            CASE f.code WHEN 'core.associations' THEN 15 WHEN 'core.portfolios' THEN 1 ELSE f.default_limit END
        FROM features f
        WHERE f.code IN ('core.associations', 'core.properties', 'core.units', 'core.people', 'core.portfolios',
                         'maintenance.basic', 'maintenance.advanced', 'inspections', 'documents.library', 
                         'compliance', 'vendor_portal', 'board_portal', 'owner_portal',
                         'payments', 'reports.standard', 'reports.advanced', 'ghl.automation')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF growth_id IS NOT NULL THEN
        INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
        SELECT growth_id, f.id, true, NULL
        FROM features f
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Tenant subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'suspended')),
    billing_reference TEXT,
    billing_customer_id TEXT,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cancellation_date DATE,
    trial_ends_at TIMESTAMPTZ,
    grace_period_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Tenant entitlements
CREATE TABLE IF NOT EXISTS tenant_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    entitlement_type TEXT NOT NULL CHECK (entitlement_type IN ('addon', 'override', 'trial')),
    is_enabled BOOLEAN DEFAULT true,
    limit_value INTEGER,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiration_date DATE,
    reason TEXT,
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_entitlements ENABLE ROW LEVEL SECURITY;

-- Portfolios
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_portfolios_tenant ON portfolios(tenant_id);
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Portfolio user assignments
CREATE TABLE IF NOT EXISTS portfolio_user_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MANAGER' CHECK (role IN ('MANAGER', 'VIEWER')),
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, user_id)
);

ALTER TABLE portfolio_user_assignments ENABLE ROW LEVEL SECURITY;

-- Association GHL connections
CREATE TABLE IF NOT EXISTS association_ghl_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    ghl_location_id TEXT NOT NULL,
    ghl_company_id TEXT,
    ghl_location_name TEXT,
    is_active BOOLEAN DEFAULT true,
    sync_enabled BOOLEAN DEFAULT true,
    webhook_secret_reference TEXT,
    sync_settings JSONB DEFAULT '{}',
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT,
    last_error TEXT,
    connected_by UUID REFERENCES auth.users(id),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ,
    disconnect_reason TEXT,
    UNIQUE(association_id)
);

ALTER TABLE association_ghl_connections ENABLE ROW LEVEL SECURITY;

-- Platform audit events
CREATE TABLE IF NOT EXISTS platform_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    actor_type TEXT NOT NULL DEFAULT 'system' CHECK (actor_type IN ('platform_admin', 'platform_support', 'system')),
    tenant_id UUID REFERENCES tenants(id),
    action TEXT NOT NULL,
    action_category TEXT NOT NULL CHECK (action_category IN ('tenant', 'plan', 'entitlement', 'support', 'integration', 'security')),
    target_type TEXT,
    target_id TEXT,
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    correlation_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_tenant ON platform_audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON platform_audit_events(created_at);
ALTER TABLE platform_audit_events ENABLE ROW LEVEL SECURITY;

-- Support access sessions
CREATE TABLE IF NOT EXISTS support_access_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_user_id UUID NOT NULL REFERENCES auth.users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reason TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 minutes'),
    actions_count INTEGER DEFAULT 0,
    last_action_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_sessions_active ON support_access_sessions(platform_user_id, tenant_id, is_active) WHERE is_active = true;
ALTER TABLE support_access_sessions ENABLE ROW LEVEL SECURITY;

-- Platform user roles
CREATE TABLE IF NOT EXISTS platform_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role platform_role NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

ALTER TABLE platform_user_roles ENABLE ROW LEVEL SECURITY;

-- Billing events
CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    billing_reference TEXT,
    billing_customer_id TEXT,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    status TEXT,
    metadata JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Tenant usage
CREATE TABLE IF NOT EXISTS tenant_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_code TEXT NOT NULL,
    current_count INTEGER DEFAULT 0,
    limit_value INTEGER,
    period_start DATE,
    period_end DATE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, feature_code, period_start)
);

ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PHASE 2: Helper Functions
-- ============================================

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
    tenant_id := (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID;
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'PLATFORM_ADMIN'
        AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_platform_support()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
        AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- PHASE 3: RLS Policies
-- ============================================

-- Tenants
CREATE POLICY tenants_platform_admin ON tenants FOR ALL USING (is_platform_admin());
CREATE POLICY tenants_tenant_admin ON tenants FOR SELECT USING (
    EXISTS (SELECT 1 FROM tenant_users WHERE tenant_id = tenants.id AND user_id = auth.uid() AND role = 'admin')
);

-- Tenant users
CREATE POLICY tenant_users_platform_admin ON tenant_users FOR ALL USING (is_platform_admin());
CREATE POLICY tenant_users_tenant_member ON tenant_users FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
);

-- Plans
CREATE POLICY plans_public_read ON plans FOR SELECT USING (is_active = true);
CREATE POLICY plans_platform_admin ON plans FOR ALL USING (is_platform_admin());

-- Features
CREATE POLICY features_public_read ON features FOR SELECT USING (is_active = true);
CREATE POLICY features_platform_admin ON features FOR ALL USING (is_platform_admin());

-- Plan features
CREATE POLICY plan_features_public_read ON plan_features FOR SELECT USING (
    EXISTS (SELECT 1 FROM plans WHERE id = plan_features.plan_id AND is_active = true)
);
CREATE POLICY plan_features_platform_admin ON plan_features FOR ALL USING (is_platform_admin());

-- Tenant subscriptions
CREATE POLICY tenant_subscriptions_platform_admin ON tenant_subscriptions FOR ALL USING (is_platform_admin());
CREATE POLICY tenant_subscriptions_tenant_admin ON tenant_subscriptions FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin')
);

-- Portfolios
CREATE POLICY portfolios_tenant_member ON portfolios FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR is_platform_admin()
);

-- Platform audit
CREATE POLICY platform_audit_platform_admin ON platform_audit_events FOR ALL USING (is_platform_support());

-- Support sessions
CREATE POLICY support_sessions_platform_admin ON support_access_sessions FOR ALL USING (is_platform_support());

-- Billing events
CREATE POLICY billing_events_platform_admin ON billing_events FOR ALL USING (is_platform_admin());

-- ============================================
-- PHASE 4: Seed Default Tenant for Existing Data
-- ============================================

DO $$
DECLARE
    default_tenant_id UUID;
    default_portfolio_id UUID;
BEGIN
    -- Create default tenant
    INSERT INTO tenants (id, name, code, status, timezone, locale, created_at)
    SELECT gen_random_uuid(), 'Exemplary Services LLC', 'exemplary-services', 'active', 'America/Chicago', 'en-US', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE code = 'exemplary-services')
    RETURNING id INTO default_tenant_id;
    
    -- Get tenant ID
    SELECT id INTO default_tenant_id FROM tenants WHERE code = 'exemplary-services';
    
    IF default_tenant_id IS NOT NULL THEN
        -- Create default portfolio
        INSERT INTO portfolios (id, tenant_id, name, description, is_default, created_at)
        SELECT gen_random_uuid(), default_tenant_id, 'Default Portfolio', 'Main portfolio', true, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE tenant_id = default_tenant_id AND is_default = true)
        RETURNING id INTO default_portfolio_id;
        
        -- Create subscription
        INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, effective_date)
        SELECT default_tenant_id, p.id, 'active', CURRENT_DATE
        FROM plans p WHERE p.code = 'growth'
        ON CONFLICT (tenant_id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- PHASE 5: Add tenant_id to existing tables
-- ============================================

DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM tenants WHERE code = 'exemplary-services';
    
    IF default_tenant_id IS NOT NULL THEN
        -- Add tenant_id columns
        ALTER TABLE associations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE associations ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id);
        
        -- Backfill data
        UPDATE associations SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE associations SET portfolio_id = (SELECT id FROM portfolios WHERE tenant_id = default_tenant_id AND is_default = true LIMIT 1) WHERE portfolio_id IS NULL;
        
        -- Add other tables
        ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE properties ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE units ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE communications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        
        -- Backfill all
        UPDATE contacts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE properties SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE units SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE vendors SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE maintenance_requests SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE inspections SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE documents SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE approvals SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE payments SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE communications SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE appointments SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;
END $$;

-- ============================================
-- PHASE 6: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_associations_tenant ON associations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_associations_portfolio ON associations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant ON units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inspections_tenant ON inspections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);

-- ============================================
-- PHASE 7: Log Completion
-- ============================================

INSERT INTO platform_audit_events (actor_type, action, action_category, target_type, target_id, new_value)
VALUES (
    'system',
    'multi_tenant_migration_completed',
    'tenant',
    'migration',
    '20260803_complete_multi_tenant',
    jsonb_build_object('timestamp', NOW(), 'phases', ARRAY['enum', 'tables', 'functions', 'policies', 'seed', 'backfill', 'indexes'])
);
