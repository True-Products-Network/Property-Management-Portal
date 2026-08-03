-- Add revoked_at column to platform_user_roles
ALTER TABLE platform_user_roles ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Update is_platform_admin function to handle NULL revoked_at
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'PLATFORM_ADMIN'
        AND (revoked_at IS NULL OR revoked_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_platform_support function
CREATE OR REPLACE FUNCTION is_platform_support()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
        AND (revoked_at IS NULL OR revoked_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
