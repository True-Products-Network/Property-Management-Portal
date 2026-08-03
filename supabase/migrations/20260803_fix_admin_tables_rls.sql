-- Fix RLS policies for admin tables to use JWT metadata instead of user_roles table
-- This aligns with how the API routes check for admin status

-- ============================================
-- Update is_admin_user function to check JWT metadata
-- ============================================
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the user has ADMIN_USER in their JWT metadata roles
    -- This matches the API route checks: user.user_metadata?.roles?.includes("ADMIN_USER")
    RETURN COALESCE(
        (auth.jwt() -> 'user_metadata' -> 'roles') ? 'ADMIN_USER',
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Alternative function that checks both old and new methods
-- ============================================
CREATE OR REPLACE FUNCTION is_admin_user_or_platform()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check JWT metadata first (new way)
    IF COALESCE((auth.jwt() -> 'user_metadata' -> 'roles') ? 'ADMIN_USER', false) THEN
        RETURN true;
    END IF;
    
    -- Check user_roles table (old way, for backwards compatibility)
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'ADMIN_USER'
        AND user_roles.revoked_at IS NULL
    ) THEN
        RETURN true;
    END IF;
    
    -- Check platform_user_roles for PLATFORM_ADMIN
    IF EXISTS (
        SELECT 1 FROM platform_user_roles 
        WHERE platform_user_roles.user_id = auth.uid() 
        AND platform_user_roles.role = 'PLATFORM_ADMIN'
        AND platform_user_roles.revoked_at IS NULL
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Fix workflows table RLS policies
-- ============================================
DROP POLICY IF EXISTS "workflows_select_policy" ON workflows;
DROP POLICY IF EXISTS "workflows_insert_policy" ON workflows;
DROP POLICY IF EXISTS "workflows_update_policy" ON workflows;
DROP POLICY IF EXISTS "workflows_delete_policy" ON workflows;

-- Allow all authenticated users to view workflows
CREATE POLICY "workflows_select_policy" ON workflows
    FOR SELECT TO authenticated
    USING (true);

-- Only admins can modify workflows
CREATE POLICY "workflows_insert_policy" ON workflows
    FOR INSERT TO authenticated
    WITH CHECK (is_admin_user_or_platform());

CREATE POLICY "workflows_update_policy" ON workflows
    FOR UPDATE TO authenticated
    USING (is_admin_user_or_platform());

CREATE POLICY "workflows_delete_policy" ON workflows
    FOR DELETE TO authenticated
    USING (is_admin_user_or_platform());

-- ============================================
-- Fix ghl_role_mappings table RLS policies
-- ============================================
DROP POLICY IF EXISTS "ghl_role_mappings_select_policy" ON ghl_role_mappings;
DROP POLICY IF EXISTS "ghl_role_mappings_insert_policy" ON ghl_role_mappings;
DROP POLICY IF EXISTS "ghl_role_mappings_update_policy" ON ghl_role_mappings;
DROP POLICY IF EXISTS "ghl_role_mappings_delete_policy" ON ghl_role_mappings;

CREATE POLICY "ghl_role_mappings_select_policy" ON ghl_role_mappings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "ghl_role_mappings_insert_policy" ON ghl_role_mappings
    FOR INSERT TO authenticated
    WITH CHECK (is_admin_user_or_platform());

CREATE POLICY "ghl_role_mappings_update_policy" ON ghl_role_mappings
    FOR UPDATE TO authenticated
    USING (is_admin_user_or_platform());

CREATE POLICY "ghl_role_mappings_delete_policy" ON ghl_role_mappings
    FOR DELETE TO authenticated
    USING (is_admin_user_or_platform());

-- ============================================
-- Fix portal_roles table RLS policies
-- ============================================
DROP POLICY IF EXISTS "portal_roles_select_policy" ON portal_roles;
DROP POLICY IF EXISTS "portal_roles_insert_policy" ON portal_roles;
DROP POLICY IF EXISTS "portal_roles_update_policy" ON portal_roles;
DROP POLICY IF EXISTS "portal_roles_delete_policy" ON portal_roles;

CREATE POLICY "portal_roles_select_policy" ON portal_roles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "portal_roles_insert_policy" ON portal_roles
    FOR INSERT TO authenticated
    WITH CHECK (is_admin_user_or_platform());

CREATE POLICY "portal_roles_update_policy" ON portal_roles
    FOR UPDATE TO authenticated
    USING (is_admin_user_or_platform());

CREATE POLICY "portal_roles_delete_policy" ON portal_roles
    FOR DELETE TO authenticated
    USING (is_admin_user_or_platform());

-- ============================================
-- Fix feature_flags table RLS policies
-- ============================================
DROP POLICY IF EXISTS "feature_flags_select_policy" ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_insert_policy" ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_update_policy" ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_delete_policy" ON feature_flags;

CREATE POLICY "feature_flags_select_policy" ON feature_flags
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "feature_flags_insert_policy" ON feature_flags
    FOR INSERT TO authenticated
    WITH CHECK (is_admin_user_or_platform());

CREATE POLICY "feature_flags_update_policy" ON feature_flags
    FOR UPDATE TO authenticated
    USING (is_admin_user_or_platform());

CREATE POLICY "feature_flags_delete_policy" ON feature_flags
    FOR DELETE TO authenticated
    USING (is_admin_user_or_platform());

-- ============================================
-- Fix audit_logs table RLS policies
-- ============================================
DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;

CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT TO authenticated
    USING (is_admin_user_or_platform());

CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- ============================================
-- Ensure tables have RLS enabled
-- ============================================
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_role_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
