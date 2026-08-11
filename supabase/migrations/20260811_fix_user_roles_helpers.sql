-- Create helper functions that properly use the new user_roles schema
-- user_roles has: user_id, tenant_id, role_id (not role)

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id UUID, p_tenant_id UUID, p_role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND ur.tenant_id = p_tenant_id
    AND r.name = p_role_name
  );
$$;

-- Function to check if user is admin (using new schema)
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND ur.tenant_id = p_tenant_id
    AND r.name = 'Admin User'
  );
$$;

-- Function to check if user is management staff
CREATE OR REPLACE FUNCTION public.is_user_management(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND ur.tenant_id = p_tenant_id
    AND r.name IN ('Admin User', 'Management Staff', 'Property Manager', 'Association Manager', 'Portfolio Manager')
  );
$$;

-- Update associations policy to use user roles properly
DROP POLICY IF EXISTS "associations_user_access" ON public.associations;

CREATE POLICY "associations_user_access"
  ON public.associations
  FOR ALL
  USING (
    -- User belongs to tenant via tenant_users
    business_id IN (
      SELECT tu.tenant_id 
      FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid()
    )
    OR
    -- User has admin role
    public.is_user_admin(auth.uid(), tenant_id)
    OR
    -- User has management role
    public.is_user_management(auth.uid(), tenant_id)
    OR
    -- Platform admin
    EXISTS (
      SELECT 1 
      FROM public.platform_user_roles pur
      WHERE pur.user_id = auth.uid()
      AND pur.role = 'PLATFORM_ADMIN'
      AND pur.revoked_at IS NULL
    )
  );
