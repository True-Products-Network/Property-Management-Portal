-- Phase 4: Entitlement Service and Plan Enforcement
-- Multi-Tenant Platform Architecture Implementation
-- Date: August 3, 2026
--
-- This migration:
-- 1. Creates entitlement resolution functions
-- 2. Adds tenant usage tracking
-- 3. Creates limit enforcement triggers
-- 4. Adds upgrade/add-on messaging support

-- ============================================
-- STEP 1: Create tenant_usage table
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_code TEXT NOT NULL,
    
    -- Usage metrics
    current_count INTEGER DEFAULT 0,
    limit_value INTEGER, -- NULL = unlimited
    
    -- Period tracking (for metered features)
    period_start DATE,
    period_end DATE,
    
    -- Metadata
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, feature_code, period_start)
);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant ON tenant_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_feature ON tenant_usage(feature_code);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_period ON tenant_usage(period_start, period_end);

ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create entitlement resolution function
-- ============================================

CREATE OR REPLACE FUNCTION resolve_entitlement(
    p_tenant_id UUID,
    p_feature_code TEXT
)
RETURNS TABLE (
    is_enabled BOOLEAN,
    limit_value INTEGER,
    current_usage INTEGER,
    remaining INTEGER,
    source TEXT, -- 'plan', 'addon', 'override', 'trial'
    effective_date DATE,
    expiration_date DATE
) AS $$
DECLARE
    v_is_enabled BOOLEAN := false;
    v_limit_value INTEGER;
    v_current_usage INTEGER := 0;
    v_source TEXT := 'plan';
    v_effective_date DATE;
    v_expiration_date DATE;
    v_plan_id UUID;
BEGIN
    -- Get tenant's active subscription plan
    SELECT ts.plan_id INTO v_plan_id
    FROM tenant_subscriptions ts
    WHERE ts.tenant_id = p_tenant_id
    AND ts.status IN ('active', 'trialing')
    AND (ts.cancellation_date IS NULL OR ts.cancellation_date > CURRENT_DATE)
    ORDER BY ts.effective_date DESC
    LIMIT 1;
    
    -- Check plan features
    SELECT 
        pf.is_enabled,
        COALESCE(pf.limit_value, f.default_limit)
    INTO v_is_enabled, v_limit_value
    FROM plan_features pf
    JOIN features f ON f.id = pf.feature_id
    WHERE pf.plan_id = v_plan_id
    AND f.code = p_feature_code;
    
    -- Check for tenant entitlements (add-ons, overrides, trials)
    -- These take precedence over plan defaults
    SELECT 
        te.is_enabled,
        te.limit_value,
        te.entitlement_type,
        te.effective_date,
        te.expiration_date
    INTO v_is_enabled, v_limit_value, v_source, v_effective_date, v_expiration_date
    FROM tenant_entitlements te
    JOIN features f ON f.id = te.feature_id
    WHERE te.tenant_id = p_tenant_id
    AND f.code = p_feature_code
    AND te.effective_date <= CURRENT_DATE
    AND (te.expiration_date IS NULL OR te.expiration_date >= CURRENT_DATE)
    ORDER BY te.effective_date DESC
    LIMIT 1;
    
    -- Get current usage
    SELECT current_count INTO v_current_usage
    FROM tenant_usage
    WHERE tenant_id = p_tenant_id
    AND feature_code = p_feature_code
    AND (period_start IS NULL OR period_start <= CURRENT_DATE)
    AND (period_end IS NULL OR period_end >= CURRENT_DATE)
    ORDER BY period_start DESC NULLS LAST
    LIMIT 1;
    
    -- Return results
    RETURN QUERY
    SELECT 
        COALESCE(v_is_enabled, false),
        v_limit_value,
        COALESCE(v_current_usage, 0),
        CASE 
            WHEN v_limit_value IS NULL THEN NULL -- Unlimited
            ELSE GREATEST(0, v_limit_value - COALESCE(v_current_usage, 0))
        END,
        COALESCE(v_source, 'plan'),
        v_effective_date,
        v_expiration_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Create check_limit function
-- ============================================

CREATE OR REPLACE FUNCTION check_limit(
    p_tenant_id UUID,
    p_feature_code TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS TABLE (
    allowed BOOLEAN,
    current_count INTEGER,
    limit_value INTEGER,
    remaining INTEGER,
    message TEXT
) AS $$
DECLARE
    v_ent RECORD;
BEGIN
    -- Get entitlement
    SELECT * INTO v_ent
    FROM resolve_entitlement(p_tenant_id, p_feature_code);
    
    -- Check if feature is enabled
    IF NOT v_ent.is_enabled THEN
        RETURN QUERY
        SELECT 
            false,
            v_ent.current_usage,
            v_ent.limit_value,
            0,
            'This feature is not available on your current plan. Please upgrade to access it.'::TEXT;
        RETURN;
    END IF;
    
    -- Check limit
    IF v_ent.limit_value IS NOT NULL THEN
        IF v_ent.current_usage + p_increment > v_ent.limit_value THEN
            RETURN QUERY
            SELECT 
                false,
                v_ent.current_usage,
                v_ent.limit_value,
                GREATEST(0, v_ent.limit_value - v_ent.current_usage),
                format('You have reached your limit of %s %s. Please upgrade or purchase an add-on to increase your limit.',
                    v_ent.limit_value, p_feature_code)::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Allowed
    RETURN QUERY
    SELECT 
        true,
        v_ent.current_usage,
        v_ent.limit_value,
        v_ent.remaining,
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: Create increment_usage function
-- ============================================

CREATE OR REPLACE FUNCTION increment_usage(
    p_tenant_id UUID,
    p_feature_code TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_limit_check RECORD;
BEGIN
    -- Check if allowed
    SELECT * INTO v_limit_check
    FROM check_limit(p_tenant_id, p_feature_code, p_increment);
    
    IF NOT v_limit_check.allowed THEN
        RAISE EXCEPTION 'Limit exceeded: %', v_limit_check.message;
    END IF;
    
    -- Increment usage
    INSERT INTO tenant_usage (
        tenant_id,
        feature_code,
        current_count,
        limit_value,
        period_start,
        period_end,
        last_updated
    )
    VALUES (
        p_tenant_id,
        p_feature_code,
        p_increment,
        v_limit_check.limit_value,
        DATE_TRUNC('month', CURRENT_DATE),
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
        NOW()
    )
    ON CONFLICT (tenant_id, feature_code, period_start)
    DO UPDATE SET 
        current_count = tenant_usage.current_count + p_increment,
        last_updated = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Create decrement_usage function
-- ============================================

CREATE OR REPLACE FUNCTION decrement_usage(
    p_tenant_id UUID,
    p_feature_code TEXT,
    p_decrement INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tenant_usage
    SET 
        current_count = GREATEST(0, current_count - p_decrement),
        last_updated = NOW()
    WHERE tenant_id = p_tenant_id
    AND feature_code = p_feature_code
    AND period_start = DATE_TRUNC('month', CURRENT_DATE);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: Create triggers for automatic usage tracking
-- ============================================

-- Trigger function for associations
CREATE OR REPLACE FUNCTION track_association_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_tenant_id := NEW.tenant_id;
        PERFORM increment_usage(v_tenant_id, 'core.associations', 1);
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_tenant_id := OLD.tenant_id;
        PERFORM decrement_usage(v_tenant_id, 'core.associations', 1);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to associations
DROP TRIGGER IF EXISTS track_association_usage ON associations;
CREATE TRIGGER track_association_usage
    AFTER INSERT OR DELETE ON associations
    FOR EACH ROW
    EXECUTE FUNCTION track_association_usage();

-- Trigger function for properties
CREATE OR REPLACE FUNCTION track_property_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_tenant_id := NEW.tenant_id;
        PERFORM increment_usage(v_tenant_id, 'core.properties', 1);
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_tenant_id := OLD.tenant_id;
        PERFORM decrement_usage(v_tenant_id, 'core.properties', 1);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to properties
DROP TRIGGER IF EXISTS track_property_usage ON properties;
CREATE TRIGGER track_property_usage
    AFTER INSERT OR DELETE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION track_property_usage();

-- Trigger function for units
CREATE OR REPLACE FUNCTION track_unit_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_tenant_id := NEW.tenant_id;
        PERFORM increment_usage(v_tenant_id, 'core.units', 1);
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_tenant_id := OLD.tenant_id;
        PERFORM decrement_usage(v_tenant_id, 'core.units', 1);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to units
DROP TRIGGER IF EXISTS track_unit_usage ON units;
CREATE TRIGGER track_unit_usage
    AFTER INSERT OR DELETE ON units
    FOR EACH ROW
    EXECUTE FUNCTION track_unit_usage();

-- Trigger function for contacts
CREATE OR REPLACE FUNCTION track_contact_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_tenant_id := NEW.tenant_id;
        PERFORM increment_usage(v_tenant_id, 'core.people', 1);
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_tenant_id := OLD.tenant_id;
        PERFORM decrement_usage(v_tenant_id, 'core.people', 1);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to contacts
DROP TRIGGER IF EXISTS track_contact_usage ON contacts;
CREATE TRIGGER track_contact_usage
    AFTER INSERT OR DELETE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION track_contact_usage();

-- Trigger function for portfolios
CREATE OR REPLACE FUNCTION track_portfolio_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_tenant_id := NEW.tenant_id;
        PERFORM increment_usage(v_tenant_id, 'core.portfolios', 1);
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_tenant_id := OLD.tenant_id;
        PERFORM decrement_usage(v_tenant_id, 'core.portfolios', 1);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to portfolios
DROP TRIGGER IF EXISTS track_portfolio_usage ON portfolios;
CREATE TRIGGER track_portfolio_usage
    AFTER INSERT OR DELETE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION track_portfolio_usage();

-- ============================================
-- STEP 7: Create view for entitlement dashboard
-- ============================================

CREATE OR REPLACE VIEW tenant_entitlements_summary AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.code as tenant_code,
    p.code as plan_code,
    p.name as plan_name,
    ts.status as subscription_status,
    ts.effective_date as subscription_start,
    f.code as feature_code,
    f.name as feature_name,
    f.category as feature_category,
    pf.is_enabled as plan_enabled,
    COALESCE(te.is_enabled, pf.is_enabled) as effective_enabled,
    COALESCE(te.limit_value, pf.limit_value, f.default_limit) as effective_limit,
    COALESCE(tu.current_count, 0) as current_usage,
    CASE 
        WHEN COALESCE(te.limit_value, pf.limit_value, f.default_limit) IS NULL THEN NULL
        ELSE GREATEST(0, COALESCE(te.limit_value, pf.limit_value, f.default_limit) - COALESCE(tu.current_count, 0))
    END as remaining,
    te.entitlement_type as override_type,
    te.effective_date as override_start,
    te.expiration_date as override_end
FROM tenants t
JOIN tenant_subscriptions ts ON ts.tenant_id = t.id AND ts.status = 'active'
JOIN plans p ON p.id = ts.plan_id
CROSS JOIN features f
LEFT JOIN plan_features pf ON pf.plan_id = p.id AND pf.feature_id = f.id
LEFT JOIN tenant_entitlements te ON te.tenant_id = t.id 
    AND te.feature_id = f.id 
    AND te.effective_date <= CURRENT_DATE
    AND (te.expiration_date IS NULL OR te.expiration_date >= CURRENT_DATE)
LEFT JOIN tenant_usage tu ON tu.tenant_id = t.id 
    AND tu.feature_code = f.code
    AND (tu.period_start IS NULL OR tu.period_start <= CURRENT_DATE)
    AND (tu.period_end IS NULL OR tu.period_end >= CURRENT_DATE)
WHERE f.is_active = true
ORDER BY t.name, f.category, f.display_order;

-- ============================================
-- STEP 8: Create function to get upgrade message
-- ============================================

CREATE OR REPLACE FUNCTION get_upgrade_message(
    p_tenant_id UUID,
    p_feature_code TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_current_plan TEXT;
    v_next_plan TEXT;
    v_message TEXT;
BEGIN
    -- Get current plan
    SELECT p.code INTO v_current_plan
    FROM tenant_subscriptions ts
    JOIN plans p ON p.id = ts.plan_id
    WHERE ts.tenant_id = p_tenant_id
    AND ts.status = 'active'
    ORDER BY ts.effective_date DESC
    LIMIT 1;
    
    -- Determine next plan and message
    v_message := CASE v_current_plan
        WHEN 'starter' THEN 
            'Upgrade to Professional to unlock more features and higher limits. Contact True Products Network to upgrade.'
        WHEN 'professional' THEN 
            'Upgrade to Growth for unlimited access to all features. Contact True Products Network to upgrade.'
        WHEN 'growth' THEN 
            'Contact True Products Network about Enterprise options for custom solutions.'
        ELSE 
            'Contact True Products Network to discuss plan options.'
    END;
    
    RETURN v_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 9: Create RLS policies for tenant_usage
-- ============================================

CREATE POLICY tenant_usage_tenant_access ON tenant_usage
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
        OR is_platform_admin()
    );

-- ============================================
-- STEP 10: Seed initial usage for existing data
-- ============================================

DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN SELECT id FROM tenants
    LOOP
        -- Count and seed associations
        INSERT INTO tenant_usage (tenant_id, feature_code, current_count, limit_value, last_updated)
        SELECT 
            t.id,
            'core.associations',
            COUNT(*),
            (SELECT COALESCE(limit_value, default_limit) 
             FROM resolve_entitlement(t.id, 'core.associations')),
            NOW()
        FROM associations
        WHERE tenant_id = t.id
        ON CONFLICT (tenant_id, feature_code, period_start) DO UPDATE
        SET current_count = EXCLUDED.current_count, last_updated = NOW();
        
        -- Count and seed properties
        INSERT INTO tenant_usage (tenant_id, feature_code, current_count, limit_value, last_updated)
        SELECT 
            t.id,
            'core.properties',
            COUNT(*),
            (SELECT COALESCE(limit_value, default_limit) 
             FROM resolve_entitlement(t.id, 'core.properties')),
            NOW()
        FROM properties
        WHERE tenant_id = t.id
        ON CONFLICT (tenant_id, feature_code, period_start) DO UPDATE
        SET current_count = EXCLUDED.current_count, last_updated = NOW();
        
        -- Count and seed units
        INSERT INTO tenant_usage (tenant_id, feature_code, current_count, limit_value, last_updated)
        SELECT 
            t.id,
            'core.units',
            COUNT(*),
            (SELECT COALESCE(limit_value, default_limit) 
             FROM resolve_entitlement(t.id, 'core.units')),
            NOW()
        FROM units
        WHERE tenant_id = t.id
        ON CONFLICT (tenant_id, feature_code, period_start) DO UPDATE
        SET current_count = EXCLUDED.current_count, last_updated = NOW();
        
        -- Count and seed contacts
        INSERT INTO tenant_usage (tenant_id, feature_code, current_count, limit_value, last_updated)
        SELECT 
            t.id,
            'core.people',
            COUNT(*),
            (SELECT COALESCE(limit_value, default_limit) 
             FROM resolve_entitlement(t.id, 'core.people')),
            NOW()
        FROM contacts
        WHERE tenant_id = t.id
        ON CONFLICT (tenant_id, feature_code, period_start) DO UPDATE
        SET current_count = EXCLUDED.current_count, last_updated = NOW();
        
        -- Count and seed portfolios
        INSERT INTO tenant_usage (tenant_id, feature_code, current_count, limit_value, last_updated)
        SELECT 
            t.id,
            'core.portfolios',
            COUNT(*),
            (SELECT COALESCE(limit_value, default_limit) 
             FROM resolve_entitlement(t.id, 'core.portfolios')),
            NOW()
        FROM portfolios
        WHERE tenant_id = t.id
        ON CONFLICT (tenant_id, feature_code, period_start) DO UPDATE
        SET current_count = EXCLUDED.current_count, last_updated = NOW();
    END LOOP;
    
    RAISE NOTICE 'Seeded initial usage for all tenants';
END $$;

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
    'phase4_migration_completed',
    'tenant',
    'migration',
    '20260803_phase4_entitlements',
    'Phase 4: Entitlement service and plan enforcement implemented',
    jsonb_build_object(
        'actions', ARRAY[
            'Created tenant_usage table',
            'Created entitlement resolution functions',
            'Created limit checking functions',
            'Created usage tracking triggers',
            'Created entitlement dashboard view',
            'Seeded initial usage for existing data'
        ],
        'timestamp', NOW()
    )
WHERE auth.uid() IS NOT NULL;
