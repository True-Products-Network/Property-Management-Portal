-- Plan Features Setup
-- Maps features to plans with limits

-- ============================================
-- Insert Plan Features (Core features included in plans)
-- ============================================

-- Starter Plan Features
INSERT INTO plan_features (plan_id, feature_key, included, usage_limit) VALUES
  ((SELECT id FROM plans WHERE code = 'starter'), 'maintenance_requests', true, 50),
  ((SELECT id FROM plans WHERE code = 'starter'), 'inspections', true, 10),
  ((SELECT id FROM plans WHERE code = 'starter'), 'payments', true, NULL),
  ((SELECT id FROM plans WHERE code = 'starter'), 'compliance', false, NULL),
  ((SELECT id FROM plans WHERE code = 'starter'), 'approvals', false, NULL),
  ((SELECT id FROM plans WHERE code = 'starter'), 'communications', true, 100),
  ((SELECT id FROM plans WHERE code = 'starter'), 'documents', true, 500),
  ((SELECT id FROM plans WHERE code = 'starter'), 'vendors', true, 20)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  included = EXCLUDED.included,
  usage_limit = EXCLUDED.usage_limit;

-- Growth Plan Features
INSERT INTO plan_features (plan_id, feature_key, included, usage_limit) VALUES
  ((SELECT id FROM plans WHERE code = 'growth'), 'maintenance_requests', true, 200),
  ((SELECT id FROM plans WHERE code = 'growth'), 'inspections', true, 50),
  ((SELECT id FROM plans WHERE code = 'growth'), 'payments', true, NULL),
  ((SELECT id FROM plans WHERE code = 'growth'), 'compliance', true, 100),
  ((SELECT id FROM plans WHERE code = 'growth'), 'approvals', true, 200),
  ((SELECT id FROM plans WHERE code = 'growth'), 'communications', true, 500),
  ((SELECT id FROM plans WHERE code = 'growth'), 'documents', true, 2000),
  ((SELECT id FROM plans WHERE code = 'growth'), 'vendors', true, 100),
  ((SELECT id FROM plans WHERE code = 'growth'), 'workflows', true, 10),
  ((SELECT id FROM plans WHERE code = 'growth'), 'advanced_reporting', true, NULL)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  included = EXCLUDED.included,
  usage_limit = EXCLUDED.usage_limit;

-- Enterprise Plan Features (unlimited)
INSERT INTO plan_features (plan_id, feature_key, included, usage_limit) VALUES
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'maintenance_requests', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'inspections', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'payments', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'compliance', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'approvals', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'communications', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'documents', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'vendors', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'workflows', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'advanced_reporting', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'api_access', true, NULL),
  ((SELECT id FROM plans WHERE code = 'enterprise'), 'bulk_operations', true, NULL)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  included = EXCLUDED.included,
  usage_limit = EXCLUDED.usage_limit;

-- ============================================
-- Core Entity Limits (Properties, Units, Contacts)
-- These are tracked separately from feature flags
-- ============================================

-- Add entity limit tracking table
CREATE TABLE IF NOT EXISTS tenant_entity_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'properties', 'units', 'contacts', 'associations'
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

-- Insert default limits based on plan
INSERT INTO tenant_entity_limits (tenant_id, entity_type, limit_count, current_count)
SELECT 
  ts.tenant_id,
  'properties' as entity_type,
  CASE 
    WHEN p.code = 'starter' THEN 5
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
    WHEN p.code = 'growth' THEN 1000
    WHEN p.code = 'enterprise' THEN 999999
    ELSE 100
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
COMMENT ON TABLE tenant_entity_limits IS 'Tracks entity count limits per tenant (properties, units, contacts)';
COMMENT ON FUNCTION check_entity_limit IS 'Checks if tenant can add more entities of a given type';
