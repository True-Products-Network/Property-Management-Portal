-- Fix: Add missing RLS policy for platform_user_roles
-- This allows authenticated users to read their own roles

-- Drop existing policy if any
DROP POLICY IF EXISTS platform_user_roles_self_read ON platform_user_roles;

-- Create policy: users can read their own roles
CREATE POLICY platform_user_roles_self_read ON platform_user_roles
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Also allow platform admins to manage all roles
DROP POLICY IF EXISTS platform_user_roles_admin_manage ON platform_user_roles;

CREATE POLICY platform_user_roles_admin_manage ON platform_user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM platform_user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'PLATFORM_ADMIN'
            AND (revoked_at IS NULL OR revoked_at > NOW())
        )
    );
