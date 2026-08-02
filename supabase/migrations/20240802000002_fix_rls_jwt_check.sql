-- Update RLS policies to check JWT metadata for admin status
-- This aligns with the API-level admin checks

-- Drop existing policies
DROP POLICY IF EXISTS "Feature flags are manageable by admin users only" ON feature_flags;
DROP POLICY IF EXISTS "Feature flag overrides are manageable by admin users only" ON feature_flag_overrides;

-- Create helper function to check admin from JWT metadata
CREATE OR REPLACE FUNCTION is_admin_from_jwt()
RETURNS BOOLEAN AS $$
DECLARE
    user_roles JSONB;
    is_admin BOOLEAN;
BEGIN
    -- Get roles from JWT user_metadata
    user_roles := auth.jwt() -> 'user_metadata' -> 'roles';
    is_admin := (auth.jwt() -> 'user_metadata' ->> 'is_admin')::BOOLEAN;
    
    -- Check if user has ADMIN_USER role or is_admin flag
    RETURN COALESCE(is_admin, false) = true OR 
           (user_roles IS NOT NULL AND user_roles @> '["ADMIN_USER"]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for feature_flags to use JWT check
CREATE POLICY "Feature flags are manageable by admin users only"
    ON feature_flags FOR ALL
    TO authenticated
    USING (is_admin_from_jwt())
    WITH CHECK (is_admin_from_jwt());

-- Update RLS policies for feature_flag_overrides to use JWT check
CREATE POLICY "Feature flag overrides are manageable by admin users only"
    ON feature_flag_overrides FOR ALL
    TO authenticated
    USING (is_admin_from_jwt())
    WITH CHECK (is_admin_from_jwt());
