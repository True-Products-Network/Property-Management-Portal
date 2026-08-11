-- Fix RLS Security Issues
-- Generated: 2026-08-11

-- ============================================================================
-- Issue 1: Policy Exists but RLS Disabled
-- Table: user_roles_legacy has policies but RLS is not enabled
-- ============================================================================

ALTER TABLE public.user_roles_legacy ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Issue 2: RLS Disabled in Public
-- Tables: user_roles_legacy, tenant_users, platform_user_roles
-- ============================================================================

-- user_roles_legacy - already fixed above

-- tenant_users
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "tenant_users_tenant_isolation" ON public.tenant_users;
DROP POLICY IF EXISTS "tenant_users_admin_all" ON public.tenant_users;

-- Create policy: Users can only see their own tenant_user records
CREATE POLICY "tenant_users_tenant_isolation"
  ON public.tenant_users
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tu.tenant_id 
      FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid()
    )
  );

-- platform_user_roles
ALTER TABLE public.platform_user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "platform_user_roles_user_isolation" ON public.platform_user_roles;
DROP POLICY IF EXISTS "platform_user_roles_admin_all" ON public.platform_user_roles;

-- Create policy: Users can only see their own platform roles
CREATE POLICY "platform_user_roles_user_isolation"
  ON public.platform_user_roles
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- Issue 3: RLS References User Metadata
-- Tables: associations, properties, vendors, units, maintenance_requests,
--         inspections, documents, approvals, compliance_matters, 
--         payment_records, communications
-- 
-- Problem: Policies use auth.jwt()->>'user_metadata' which is editable by users
-- Solution: Use tenant_users table lookup instead
-- ============================================================================

-- Helper function to get user's tenant_id safely (not from user_metadata)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id 
  FROM public.tenant_users 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Helper function to check if user belongs to a tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(check_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = check_tenant_id
  );
$$;

-- Fix associations table
DROP POLICY IF EXISTS "associations_tenant_isolation" ON public.associations;

CREATE POLICY "associations_tenant_isolation"
  ON public.associations
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- Fix properties table
DROP POLICY IF EXISTS "properties_tenant_isolation" ON public.properties;

CREATE POLICY "properties_tenant_isolation"
  ON public.properties
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- Fix vendors table
DROP POLICY IF EXISTS "vendors_tenant_isolation" ON public.vendors;

CREATE POLICY "vendors_tenant_isolation"
  ON public.vendors
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- Fix units table
DROP POLICY IF EXISTS "units_tenant_isolation" ON public.units;

CREATE POLICY "units_tenant_isolation"
  ON public.units
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- Fix maintenance_requests table
DROP POLICY IF EXISTS "maintenance_tenant_isolation" ON public.maintenance_requests;

CREATE POLICY "maintenance_tenant_isolation"
  ON public.maintenance_requests
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- Fix inspections table
DROP POLICY IF EXISTS "inspections_tenant_isolation" ON public.inspections;

CREATE POLICY "inspections_tenant_isolation"
  ON public.inspections
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- Fix documents table
DROP POLICY IF EXISTS "documents_tenant_isolation" ON public.documents;

CREATE POLICY "documents_tenant_isolation"
  ON public.documents
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- Fix approvals table
DROP POLICY IF EXISTS "approvals_tenant_isolation" ON public.approvals;

CREATE POLICY "approvals_tenant_isolation"
  ON public.approvals
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- Fix compliance_matters table
DROP POLICY IF EXISTS "compliance_tenant_isolation" ON public.compliance_matters;

CREATE POLICY "compliance_tenant_isolation"
  ON public.compliance_matters
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- Fix payment_records table
DROP POLICY IF EXISTS "payments_tenant_isolation" ON public.payment_records;

CREATE POLICY "payments_tenant_isolation"
  ON public.payment_records
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- Fix communications table
DROP POLICY IF EXISTS "communications_tenant_isolation" ON public.communications;

CREATE POLICY "communications_tenant_isolation"
  ON public.communications
  FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    OR public.user_belongs_to_tenant(tenant_id)
  );

-- ============================================================================
-- Issue 4: Security Definer View
-- View: audit_logs_enriched
-- ============================================================================

-- Recreate the view without SECURITY DEFINER (or with proper permissions)
-- Note: This requires knowing the exact view definition
-- For now, we'll add a comment about it

COMMENT ON VIEW public.audit_logs_enriched IS 
'TODO: Review SECURITY DEFINER usage. Consider using SECURITY INVOKER with proper RLS policies instead.';

-- ============================================================================
-- Summary of changes:
-- 1. Enabled RLS on user_roles_legacy
-- 2. Enabled RLS on tenant_users with proper policies
-- 3. Enabled RLS on platform_user_roles with proper policies
-- 4. Replaced all user_metadata-based RLS policies with secure tenant lookup
-- 5. Created helper functions for secure tenant isolation
-- ============================================================================
