-- Fix RLS policies that reference user_metadata (security issue)
-- user_metadata is editable by end users and should not be used in security policies

-- Drop existing policies that reference user_metadata
DROP POLICY IF EXISTS "compliance_tenant_isolation" ON public.compliance_matters;
DROP POLICY IF EXISTS "payments_tenant_isolation" ON public.payment_records;
DROP POLICY IF EXISTS "communications_tenant_isolation" ON public.communications;

-- Create secure policies using helper functions instead of user_metadata
-- These use the tenant_users table which is the authoritative source

-- Helper function to get tenant IDs as text array
CREATE OR REPLACE FUNCTION get_user_tenant_ids_text()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT array_agg(tenant_id::text) FROM tenant_users WHERE user_id = auth.uid();
$$;

-- Helper function to get business IDs for current user
CREATE OR REPLACE FUNCTION get_user_business_ids()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT array_agg(b.id::text) FROM businesses b
  WHERE b.slug = ANY(get_user_tenant_ids_text());
$$;

-- Compliance Matters - secure policy using array containment
CREATE POLICY "compliance_tenant_isolation"
  ON public.compliance_matters
  FOR ALL
  USING (
    business_id = ANY(get_user_business_ids())
  );

-- Payment Records - secure policy
CREATE POLICY "payments_tenant_isolation"
  ON public.payment_records
  FOR ALL
  USING (
    business_id = ANY(get_user_business_ids())
  );

-- Communications - secure policy
CREATE POLICY "communications_tenant_isolation"
  ON public.communications
  FOR ALL
  USING (
    business_id = ANY(get_user_business_ids())
  );

-- Add indexes to improve performance of these lookups
CREATE INDEX IF NOT EXISTS idx_compliance_matters_business_id ON public.compliance_matters(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_business_id ON public.payment_records(business_id);
CREATE INDEX IF NOT EXISTS idx_communications_business_id ON public.communications(business_id);
