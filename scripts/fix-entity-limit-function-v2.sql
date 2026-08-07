-- Fix check_entity_limit function - fix ambiguous column reference
-- Drops the broken version and recreates with explicit table references

-- Drop existing functions
DROP FUNCTION IF EXISTS public.check_entity_limit(uuid, text);
DROP FUNCTION IF EXISTS public.check_entity_limit(uuid, character varying);
DROP FUNCTION IF EXISTS public.check_entity_limit(uuid, varchar);

-- Create the correct function with explicit table aliases
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

  -- Get limit from tenant_entity_limits (use explicit table alias)
  SELECT tel.limit_count INTO v_limit
  FROM tenant_entity_limits tel
  WHERE tel.tenant_id = p_tenant_id AND tel.entity_type = p_entity_type;

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_entity_limit(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_entity_limit(UUID, VARCHAR) TO service_role;

COMMENT ON FUNCTION check_entity_limit IS 'Checks if tenant can add more entities of a given type';
