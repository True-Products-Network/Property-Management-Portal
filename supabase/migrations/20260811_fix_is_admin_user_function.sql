-- Fix is_admin_user function to use correct schema
-- The user_roles table now uses role_id (UUID) instead of role (text)

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has admin role via user_roles -> roles
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name = 'Admin User'
        AND ur.revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix any other functions that might reference the old column
CREATE OR REPLACE FUNCTION get_user_effective_permissions(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE(permission_code TEXT) AS $$
DECLARE
    v_role TEXT;
    v_has_custom_roles BOOLEAN;
BEGIN
    -- Check if user has custom roles
    SELECT EXISTS(
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id AND tenant_id = p_tenant_id
    ) INTO v_has_custom_roles;
    
    -- If custom roles exist, use those permissions
    IF v_has_custom_roles THEN
        RETURN QUERY
        SELECT rp.permission_code
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        WHERE ur.user_id = p_user_id
        AND ur.tenant_id = p_tenant_id;
    ELSE
        -- Fall back to default tenant role from tenant_users
        SELECT tu.role INTO v_role
        FROM tenant_users tu
        WHERE tu.user_id = p_user_id
        AND tu.tenant_id = p_tenant_id
        LIMIT 1;
        
        IF v_role = 'admin' THEN
            RETURN QUERY SELECT p.code FROM permissions p WHERE p.module != 'admin';
        ELSE
            RETURN QUERY SELECT p.code FROM permissions p 
            WHERE p.module IN ('dashboard', 'maintenance', 'documents', 'communications');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
