-- Fix is_admin_user function - user_roles doesn't have revoked_at
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name = 'Admin User'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix is_management_staff function
CREATE OR REPLACE FUNCTION is_management_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name IN ('Admin User', 'Management Staff', 'Property Manager', 'Association Manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
