-- EMERGENCY RLS FIX - Run this entire file at once
-- Fixes infinite recursion in tenant_users policy

-- First, drop the problematic policies
DROP POLICY IF EXISTS "tenant_users_tenant_admin" ON public.tenant_users;
DROP POLICY IF EXISTS "associations_platform_support" ON public.associations;
DROP POLICY IF EXISTS "properties_platform_support" ON public.properties;
DROP POLICY IF EXISTS "contacts_platform_support" ON public.contacts;
DROP POLICY IF EXISTS "vendors_platform_support" ON public.vendors;
DROP POLICY IF EXISTS "units_platform_support" ON public.units;
DROP POLICY IF EXISTS "maintenance_platform_support" ON public.maintenance_requests;
DROP POLICY IF EXISTS "inspections_platform_support" ON public.inspections;
DROP POLICY IF EXISTS "documents_platform_support" ON public.documents;
DROP POLICY IF EXISTS "approvals_platform_support" ON public.approvals;
DROP POLICY IF EXISTS "tenant_entitlements_tenant_admin" ON public.tenant_entitlements;
DROP POLICY IF EXISTS "tenant_subscriptions_tenant_admin" ON public.tenant_subscriptions;
DROP POLICY IF EXISTS "association_ghl_tenant_member" ON public.association_ghl_connections;

-- Create helper functions to avoid recursion
CREATE OR REPLACE FUNCTION get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_admin_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin';
$$;

CREATE OR REPLACE FUNCTION get_user_association_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM associations WHERE tenant_id IN (SELECT get_user_tenant_ids());
$$;

-- Recreate policies using helper functions
CREATE POLICY "tenant_users_tenant_admin"
  ON public.tenant_users
  FOR SELECT
  USING (tenant_id IN (SELECT get_user_admin_tenant_ids()));

CREATE POLICY "associations_platform_support"
  ON public.associations
  FOR ALL
  USING (is_platform_support() OR tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "properties_platform_support"
  ON public.properties
  FOR ALL
  USING (is_platform_support() OR tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "contacts_platform_support"
  ON public.contacts
  FOR ALL
  USING (is_platform_support() OR tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "vendors_platform_support"
  ON public.vendors
  FOR ALL
  USING (is_platform_support() OR tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "units_platform_support"
  ON public.units
  FOR ALL
  USING (is_platform_support() OR tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "maintenance_platform_support"
  ON public.maintenance_requests
  FOR ALL
  USING (is_platform_support() OR tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "inspections_platform_support"
  ON public.inspections
  FOR ALL
  USING (is_platform_support() OR tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "documents_platform_support"
  ON public.documents
  FOR ALL
  USING (is_platform_support() OR tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "approvals_platform_support"
  ON public.approvals
  FOR ALL
  USING (is_platform_support() OR tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "tenant_entitlements_tenant_admin"
  ON public.tenant_entitlements
  FOR SELECT
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "tenant_subscriptions_tenant_admin"
  ON public.tenant_subscriptions
  FOR SELECT
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "association_ghl_tenant_member"
  ON public.association_ghl_connections
  FOR SELECT
  USING (association_id IN (SELECT get_user_association_ids()));
