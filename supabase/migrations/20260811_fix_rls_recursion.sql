-- Fix RLS Recursion Issues
-- Date: August 11, 2026
-- Issue: tenant_users policy causing infinite recursion

-- ============================================================================
-- Fix tenant_users recursion - Use auth.uid() directly instead of subquery
-- ============================================================================

DROP POLICY IF EXISTS "tenant_users_tenant_admin" ON public.tenant_users;

-- Tenant admins can see users in their tenant (fixed to avoid recursion)
-- Use a security definer function instead of subquery on same table
CREATE OR REPLACE FUNCTION get_user_admin_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin';
$$;

CREATE POLICY "tenant_users_tenant_admin"
  ON public.tenant_users
  FOR SELECT
  USING (
    tenant_id IN (SELECT get_user_admin_tenant_ids())
  );

-- ============================================================================
-- Fix associations - Avoid recursion in tenant check
-- ============================================================================

DROP POLICY IF EXISTS "associations_platform_support" ON public.associations;

CREATE OR REPLACE FUNCTION get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid();
$$;

CREATE POLICY "associations_platform_support"
  ON public.associations
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix properties - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "properties_platform_support" ON public.properties;

CREATE POLICY "properties_platform_support"
  ON public.properties
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix contacts - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "contacts_platform_support" ON public.contacts;

CREATE POLICY "contacts_platform_support"
  ON public.contacts
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix vendors - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "vendors_platform_support" ON public.vendors;

CREATE POLICY "vendors_platform_support"
  ON public.vendors
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix units - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "units_platform_support" ON public.units;

CREATE POLICY "units_platform_support"
  ON public.units
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix maintenance_requests - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "maintenance_platform_support" ON public.maintenance_requests;

CREATE POLICY "maintenance_platform_support"
  ON public.maintenance_requests
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix inspections - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "inspections_platform_support" ON public.inspections;

CREATE POLICY "inspections_platform_support"
  ON public.inspections
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix documents - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "documents_platform_support" ON public.documents;

CREATE POLICY "documents_platform_support"
  ON public.documents
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix approvals - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "approvals_platform_support" ON public.approvals;

CREATE POLICY "approvals_platform_support"
  ON public.approvals
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix tenant_entitlements - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "tenant_entitlements_tenant_admin" ON public.tenant_entitlements;

CREATE POLICY "tenant_entitlements_tenant_admin"
  ON public.tenant_entitlements
  FOR SELECT
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix tenant_subscriptions - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "tenant_subscriptions_tenant_admin" ON public.tenant_subscriptions;

CREATE POLICY "tenant_subscriptions_tenant_admin"
  ON public.tenant_subscriptions
  FOR SELECT
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- Fix association_ghl_connections - Avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "association_ghl_tenant_member" ON public.association_ghl_connections;

CREATE OR REPLACE FUNCTION get_user_association_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM associations WHERE tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid());
$$;

CREATE POLICY "association_ghl_tenant_member"
  ON public.association_ghl_connections
  FOR SELECT
  USING (
    association_id IN (SELECT get_user_association_ids())
  );

-- ============================================================================
-- Summary:
-- 1. Created helper functions with SECURITY DEFINER to avoid recursion
-- 2. get_user_tenant_ids() - Returns all tenant_ids for current user
-- 3. get_user_admin_tenant_ids() - Returns tenant_ids where user is admin
-- 4. get_user_association_ids() - Returns association_ids for user's tenants
-- 5. Updated all policies to use these functions instead of subqueries
-- ============================================================================
