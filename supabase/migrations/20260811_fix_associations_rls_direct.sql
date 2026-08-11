-- Direct fix for associations RLS policy
-- Check what policies exist and fix them

-- First, let's see what policies exist on associations
-- SELECT * FROM pg_policies WHERE tablename = 'associations';

-- Drop all existing policies on associations to start fresh
DROP POLICY IF EXISTS "associations_tenant_isolation" ON public.associations;
DROP POLICY IF EXISTS "associations_platform_support" ON public.associations;
DROP POLICY IF EXISTS "associations_admin_all" ON public.associations;
DROP POLICY IF EXISTS "associations_management_all" ON public.associations;
DROP POLICY IF EXISTS "associations_user_select" ON public.associations;
DROP POLICY IF EXISTS "Users can view their associations" ON public.associations;
DROP POLICY IF EXISTS "Management can manage associations" ON public.associations;

-- Enable RLS
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that only checks tenant_users (not user_roles)
CREATE POLICY "associations_tenant_isolation"
  ON public.associations
  FOR ALL
  USING (
    business_id IN (
      SELECT tu.tenant_id 
      FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid()
    )
    OR
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid()
    )
  );

-- Also create a policy for platform admins
CREATE POLICY "associations_platform_admin"
  ON public.associations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM public.platform_user_roles pur
      WHERE pur.user_id = auth.uid()
      AND pur.role = 'PLATFORM_ADMIN'
      AND pur.revoked_at IS NULL
    )
  );
