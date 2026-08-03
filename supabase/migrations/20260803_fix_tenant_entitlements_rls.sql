-- Fix RLS for tenant_entitlements table
-- Allow platform admins to manage entitlements

-- Drop existing policies
DROP POLICY IF EXISTS tenant_entitlements_select_policy ON tenant_entitlements;
DROP POLICY IF EXISTS tenant_entitlements_insert_policy ON tenant_entitlements;
DROP POLICY IF EXISTS tenant_entitlements_update_policy ON tenant_entitlements;
DROP POLICY IF EXISTS tenant_entitlements_delete_policy ON tenant_entitlements;
DROP POLICY IF EXISTS tenant_entitlements_platform_read ON tenant_entitlements;

-- Create function to check platform admin (if not exists)
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

-- Allow all authenticated users to view entitlements
CREATE POLICY tenant_entitlements_select_policy ON tenant_entitlements
    FOR SELECT TO authenticated
    USING (true);

-- Allow platform admins to insert entitlements
CREATE POLICY tenant_entitlements_insert_policy ON tenant_entitlements
    FOR INSERT TO authenticated
    WITH CHECK (is_platform_admin());

-- Allow platform admins to update entitlements
CREATE POLICY tenant_entitlements_update_policy ON tenant_entitlements
    FOR UPDATE TO authenticated
    USING (is_platform_admin());

-- Allow platform admins to delete entitlements
CREATE POLICY tenant_entitlements_delete_policy ON tenant_entitlements
    FOR DELETE TO authenticated
    USING (is_platform_admin());

-- Ensure RLS is enabled
ALTER TABLE tenant_entitlements ENABLE ROW LEVEL SECURITY;
