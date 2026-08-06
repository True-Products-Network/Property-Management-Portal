-- Fix check_entity_limit function overloading
-- Run this in Supabase SQL Editor

-- 1. Drop existing functions to resolve overloading
DROP FUNCTION IF EXISTS public.check_entity_limit(uuid, text);
DROP FUNCTION IF EXISTS public.check_entity_limit(uuid, character varying);

-- 2. Recreate with single clear signature
CREATE OR REPLACE FUNCTION public.check_entity_limit(
    p_tenant_id UUID,
    p_entity_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_count INTEGER;
    v_limit INTEGER;
    v_plan_id UUID;
BEGIN
    -- Get the tenant's plan
    SELECT plan_id INTO v_plan_id
    FROM tenant_subscriptions
    WHERE tenant_id = p_tenant_id
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no plan, deny
    IF v_plan_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get limit for this entity type from plan entitlements
    SELECT value::INTEGER INTO v_limit
    FROM plan_entitlements
    WHERE plan_id = v_plan_id
    AND entity_type = p_entity_type;
    
    -- If no limit set, allow unlimited
    IF v_limit IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Count current entities
    CASE p_entity_type
        WHEN 'associations' THEN
            SELECT COUNT(*) INTO v_current_count
            FROM associations
            WHERE tenant_id = p_tenant_id;
        WHEN 'contacts' THEN
            SELECT COUNT(*) INTO v_current_count
            FROM contacts
            WHERE tenant_id = p_tenant_id;
        WHEN 'properties' THEN
            SELECT COUNT(*) INTO v_current_count
            FROM properties
            WHERE tenant_id = p_tenant_id;
        WHEN 'units' THEN
            SELECT COUNT(*) INTO v_current_count
            FROM units
            WHERE tenant_id = p_tenant_id;
        ELSE
            RETURN TRUE;
    END CASE;
    
    RETURN v_current_count < v_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_entity_limit(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_entity_limit(UUID, TEXT) TO service_role;
