-- Fix is_admin_user function to use user_roles table
-- This ensures consistency across all RLS policies

-- Drop all versions of is_admin_user to clear any cached/old definitions
DROP FUNCTION IF EXISTS is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS is_admin_user(UUID) CASCADE;

-- Create the canonical version using user_roles table
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'ADMIN_USER'
        AND user_roles.revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also create version with parameter for backward compatibility
CREATE OR REPLACE FUNCTION is_admin_user(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = check_user_id
        AND user_roles.role = 'ADMIN_USER'
        AND user_roles.revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
