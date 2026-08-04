-- Plan Features Setup
-- Maps features to plans with limits

-- ============================================
-- Insert Plan Features (Core features included in plans)
-- Uses correct column names: feature_id, is_enabled, limit_value
-- ============================================

DO $$
DECLARE
    starter_id UUID;
    prof_id UUID;
    growth_id UUID;
    enterprise_id UUID;
BEGIN
    -- Get plan IDs
    SELECT id INTO starter_id FROM plans WHERE code = 'starter';
    SELECT id INTO prof_id FROM plans WHERE code = 'professional';
    SELECT id INTO growth_id FROM plans WHERE code = 'growth';
    SELECT id INTO enterprise_id FROM plans WHERE code = 'enterprise';

    -- ============================================
    -- STARTER PLAN
    -- ============================================
    IF starter_id IS NOT NULL THEN
        -- Core entities with limits
        INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
        SELECT starter_id, f.id, true, 
            CASE f.code 
                WHEN 'core.associations' THEN 1
                WHEN 'core.properties' THEN 5
                WHEN 'core.units' THEN 50
                WHEN 'core.people' THEN 100
                WHEN 'core.portfolios' THEN 1
                ELSE f.default_limit 
            END
        FROM features f
        WHERE f.code IN ('core.associations', 'core.properties', 'core.units', 'core.people', 'core.portfolios')
        ON CONFLICT (plan_id, feature_id) DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            limit_value = EXCLUDED.limit_value;

        -- Features included
        INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
        SELECT starter_id, f.id, true, NULL
        FROM features f
        WHERE f.code IN ('maintenance.basic', 'inspections', 'documents.library', 'owner_portal', 'reports.standard')
        ON CONFLICT (plan_id, feature_id) DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            limit_value = EXCLUDED.limit_value;
    END IF;

    -- ============================================
    -- PROFESSIONAL PLAN
    -- ============================================
    IF prof_id IS NOT NULL THEN
        -- Core entities with limits
        INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
        SELECT prof_id, true, 
            CASE f.code 
                WHEN 'core.associations' THEN 3
                WHEN 'core.properties' THEN 15
                WHEN 'core.units' THEN 150
                WHEN 'core.people' THEN 300
                WHEN 'core.portfolios' THEN 1
                ELSE f.default_limit 
            END
        FROM features f
        WHERE f.code IN ('core.associations', 'core.properties', 'core.units', 'core.people', 'core.portfolios')
        ON CONFLICT (plan_id, feature_id) DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            limit_value = EXCLUDED.limit_value;

        -- Features included
        INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
        SELECT prof_id, f.id, true, NULL
        FROM features f
        WHERE f.code IN ('maintenance.basic', 'maintenance.advanced', 'inspections', 'documents.library', 
                         'compliance', 'vendor_portal', 'board_portal', 'owner_portal',
                         'payments', 'reports.standard', 'reports.advanced', 'ghl.automation')
        ON CONFLICT (plan_id, feature_id) DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            limit_value = EXCLUDED.limit_value;
    END IF;

    -- ============================================
    -- GROWTH PLAN
    -- ============================================
    IF growth_id IS NOT NULL THEN
        -- Core entities with limits
        INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
        SELECT growth_id, f.id, true, 
            CASE f.code 
                WHEN 'core.associations' THEN 5
                WHEN 'core.properties' THEN 25
                WHEN 'core.units' THEN 500
                WHEN 'core.people' THEN 1000
                WHEN 'core.portfolios' THEN 1
                ELSE f.default_limit 
            END
        FROM features f
        WHERE f.code IN ('core.associations', 'core.properties', 'core.units', 'core.people', 'core.portfolios')
        ON CONFLICT (plan_id, feature_id) DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            limit_value = EXCLUDED.limit_value;

        -- All features included
        INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
        SELECT growth_id, f.id, true, NULL
        FROM features f
        WHERE f.code NOT IN ('core.associations', 'core.properties', 'core.units', 'core.people', 'core.portfolios')
        ON CONFLICT (plan_id, feature_id) DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            limit_value = EXCLUDED.limit_value;
    END IF;

    -- ============================================
    -- ENTERPRISE PLAN (Unlimited everything)
    -- ============================================
    IF enterprise_id IS NOT NULL THEN
        INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
        SELECT enterprise_id, f.id, true, NULL
        FROM features f
        ON CONFLICT (plan_id, feature_id) DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            limit_value = EXCLUDED.limit_value;
    END IF;
END $$;

-- ============================================
-- Entity Limits Table for Core Data
-- ============================================

-- Add entity limit tracking table
CREATE TABLE IF NOT EXISTS tenant_entity_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'properties', 'units', 'contacts', 'associations', 'portfolios'
  limit_count INTEGER NOT NULL,
  current_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type)
);

-- Enable RLS
ALTER TABLE tenant_entity_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS tenant_entity_limits_select_policy ON tenant_entity_limits;
DROP POLICY IF EXISTS tenant_entity_limits_insert_policy ON tenant_entity_limits;
DROP POLICY IF EXISTS tenant_entity_limits_update_policy ON tenant_entity_limits;

CREATE POLICY tenant_entity_limits_select_policy ON tenant_entity_limits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY tenant_entity_limits_insert_policy ON tenant_entity_limits
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY tenant_entity_limits_update_policy ON tenant_entity_limits
  FOR UPDATE TO authenticated USING (true);

-- Insert default limits based on plan for all tenants
INSERT INTO tenant_entity_limits (tenant_id, entity_type, limit_count, current_count)
SELECT 
  ts.tenant_id,
  'associations' as entity_type,
  CASE 
    WHEN p.code = 'starter' THEN 1
    WHEN p.code = 'professional' THEN 3
    WHEN p.code = 'growth' THEN 5
    WHEN p.code = 'enterprise' THEN 999999
    ELSE 1
  END as limit_count,
  0 as current_count
FROM tenant_subscriptions ts
JOIN plans p ON ts.plan_id = p.id
ON CONFLICT (tenant_id, entity_type) DO NOTHING;

INSERT INTO tenant_entity_limits (tenant_id, entity_type, limit_count, current_count)
SELECT 
  ts.tenant_id,
  'properties' as entity_type,
  CASE 
    WHEN p.code = 'starter' THEN 5
    WHEN p.code = 'professional' THEN 15
    WHEN p.code = 'growth' THEN 25
    WHEN p.code = 'enterprise' THEN 999999
    ELSE 5
  END as limit_count,
  0 as current_count
FROM tenant_subscriptions ts
JOIN plans p ON ts.plan_id = p.id
ON CONFLICT (tenant_id, entity_type) DO NOTHING;

INSERT INTO tenant_entity_limits (tenant_id, entity_type, limit_count, current_count)
SELECT 
  ts.tenant_id,
  'units' as entity_type,
  CASE 
    WHEN p.code = 'starter' THEN 50
    WHEN p.code = 'professional' THEN 150
    WHEN p.code = 'growth' THEN 500
    WHEN p.code = 'enterprise' THEN 999999
    ELSE 50
  END as limit_count,
  0 as current_count
FROM tenant_subscriptions ts
JOIN plans p ON ts.plan_id = p.id
ON CONFLICT (tenant_id, entity_type) DO NOTHING;

INSERT INTO tenant_entity_limits (tenant_id, entity_type, limit_count, current_count)
SELECT 
  ts.tenant_id,
  'contacts' as entity_type,
  CASE 
    WHEN p.code = 'starter' THEN 100
    WHEN p.code = 'professional' THEN 300
    WHEN p.code = 'growth' THEN 1000
    WHEN p.code = 'enterprise' THEN 999999
    ELSE 100
  END as limit_count,
  0 as current_count
FROM tenant_subscriptions ts
JOIN plans p ON ts.plan_id = p.id
ON CONFLICT (tenant_id, entity_type) DO NOTHING;

INSERT INTO tenant_entity_limits (tenant_id, entity_type, limit_count, current_count)
SELECT 
  ts.tenant_id,
  'portfolios' as entity_type,
  CASE 
    WHEN p.code = 'starter' THEN 1
    WHEN p.code = 'professional' THEN 1
    WHEN p.code = 'growth' THEN 1
    WHEN p.code = 'enterprise' THEN 999999
    ELSE 1
  END as limit_count,
  0 as current_count
FROM tenant_subscriptions ts
JOIN plans p ON ts.plan_id = p.id
ON CONFLICT (tenant_id, entity_type) DO NOTHING;

-- ============================================
-- Function to check entity limits
-- ============================================
CREATE OR REPLACE FUNCTION check_entity_limit(
  p_tenant_id UUID,
  p_entity_type VARCHAR
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  v_current INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get current count from actual table
  CASE p_entity_type
    WHEN 'properties' THEN
      SELECT COUNT(*) INTO v_current FROM properties WHERE tenant_id = p_tenant_id;
    WHEN 'units' THEN
      SELECT COUNT(*) INTO v_current FROM units WHERE tenant_id = p_tenant_id;
    WHEN 'contacts' THEN
      SELECT COUNT(*) INTO v_current FROM contacts WHERE tenant_id = p_tenant_id;
    WHEN 'associations' THEN
      SELECT COUNT(*) INTO v_current FROM associations WHERE tenant_id = p_tenant_id;
    WHEN 'portfolios' THEN
      SELECT COUNT(*) INTO v_current FROM portfolios WHERE tenant_id = p_tenant_id;
    ELSE
      v_current := 0;
  END CASE;
  
  -- Get limit
  SELECT limit_count INTO v_limit
  FROM tenant_entity_limits
  WHERE tenant_id = p_tenant_id AND entity_type = p_entity_type;
  
  -- If no limit set, allow unlimited
  IF v_limit IS NULL THEN
    v_limit := 999999;
  END IF;
  
  RETURN QUERY SELECT 
    v_current < v_limit as allowed,
    v_current as current_count,
    v_limit as limit_count,
    GREATEST(0, v_limit - v_current) as remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE tenant_entity_limits IS 'Tracks entity count limits per tenant (properties, units, contacts, associations, portfolios)';
COMMENT ON FUNCTION check_entity_limit IS 'Checks if tenant can add more entities of a given type';
