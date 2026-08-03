-- Fix RLS policies for feature_flags table to work with Platform Admins (v2)
-- Drops existing policies first to avoid conflicts

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Feature flags are viewable by authenticated users" ON feature_flags;
DROP POLICY IF EXISTS "Feature flags are manageable by admin users only" ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_select_policy" ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_insert_policy" ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_update_policy" ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_delete_policy" ON feature_flags;

-- Ensure is_platform_admin function exists
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check JWT metadata
    IF COALESCE((auth.jwt() -> 'user_metadata' -> 'roles') ? 'PLATFORM_ADMIN', false) THEN
        RETURN true;
    END IF;
    
    -- Check platform_user_roles table
    RETURN EXISTS (
        SELECT 1 FROM platform_user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'PLATFORM_ADMIN'
        AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies
CREATE POLICY "feature_flags_select" ON feature_flags
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "feature_flags_insert" ON feature_flags
    FOR INSERT TO authenticated
    WITH CHECK (is_platform_admin());

CREATE POLICY "feature_flags_update" ON feature_flags
    FOR UPDATE TO authenticated
    USING (is_platform_admin());

CREATE POLICY "feature_flags_delete" ON feature_flags
    FOR DELETE TO authenticated
    USING (is_platform_admin());

-- Also fix feature_flag_overrides
DROP POLICY IF EXISTS "Feature flag overrides are viewable by authenticated users" ON feature_flag_overrides;
DROP POLICY IF EXISTS "Feature flag overrides are manageable by admin users only" ON feature_flag_overrides;
DROP POLICY IF EXISTS "feature_flag_overrides_select_policy" ON feature_flag_overrides;
DROP POLICY IF EXISTS "feature_flag_overrides_insert_policy" ON feature_flag_overrides;
DROP POLICY IF EXISTS "feature_flag_overrides_update_policy" ON feature_flag_overrides;
DROP POLICY IF EXISTS "feature_flag_overrides_delete_policy" ON feature_flag_overrides;

CREATE POLICY "feature_flag_overrides_select" ON feature_flag_overrides
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "feature_flag_overrides_insert" ON feature_flag_overrides
    FOR INSERT TO authenticated
    WITH CHECK (is_platform_admin());

CREATE POLICY "feature_flag_overrides_update" ON feature_flag_overrides
    FOR UPDATE TO authenticated
    USING (is_platform_admin());

CREATE POLICY "feature_flag_overrides_delete" ON feature_flag_overrides
    FOR DELETE TO authenticated
    USING (is_platform_admin());

-- Ensure RLS is enabled
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_overrides ENABLE ROW LEVEL SECURITY;

-- Insert some default feature flags if table is empty
INSERT INTO feature_flags (key, name, description, enabled, environment, allowed_roles, user_percentage)
VALUES 
    ('maintenance_requests', 'Maintenance Requests', 'Enable maintenance request feature', true, 'all', ARRAY['all'], 100),
    ('inspections', 'Inspections', 'Enable inspections feature', true, 'all', ARRAY['all'], 100),
    ('payments', 'Payments', 'Enable payments feature', false, 'all', ARRAY['all'], 100),
    ('compliance', 'Compliance', 'Enable compliance tracking', true, 'all', ARRAY['all'], 100)
ON CONFLICT (key) DO NOTHING;
