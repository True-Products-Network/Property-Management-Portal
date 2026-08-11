-- Fix RLS policies that reference user_metadata (security issue)
-- user_metadata is editable by end users and should not be used in security policies

-- Drop existing policies that reference user_metadata
DROP POLICY IF EXISTS "compliance_tenant_isolation" ON public.compliance_matters;
DROP POLICY IF EXISTS "payments_tenant_isolation" ON public.payment_records;
DROP POLICY IF EXISTS "communications_tenant_isolation" ON public.communications;

-- Drop the helper functions if they exist
DROP FUNCTION IF EXISTS get_user_business_ids();
DROP FUNCTION IF EXISTS get_user_tenant_ids_text();
DROP FUNCTION IF EXISTS get_user_accessible_business_ids();

-- Create a single helper function that does the join internally
-- slug is text, tenant_id is uuid - so cast slug to uuid
CREATE OR REPLACE FUNCTION get_user_accessible_business_ids()
RETURNS TABLE(business_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT b.id::text 
  FROM businesses b
  INNER JOIN tenant_users tu ON b.slug::uuid = tu.tenant_id
  WHERE tu.user_id = auth.uid();
$$;

-- Compliance Matters - secure policy
CREATE POLICY "compliance_tenant_isolation"
  ON public.compliance_matters
  FOR ALL
  USING (
    business_id IN (SELECT get_user_accessible_business_ids())
  );

-- Payment Records - secure policy
CREATE POLICY "payments_tenant_isolation"
  ON public.payment_records
  FOR ALL
  USING (
    business_id IN (SELECT get_user_accessible_business_ids())
  );

-- Communications - secure policy
CREATE POLICY "communications_tenant_isolation"
  ON public.communications
  FOR ALL
  USING (
    business_id IN (SELECT get_user_accessible_business_ids())
  );

-- Add indexes to improve performance of these lookups
CREATE INDEX IF NOT EXISTS idx_compliance_matters_business_id ON public.compliance_matters(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_business_id ON public.payment_records(business_id);
CREATE INDEX IF NOT EXISTS idx_communications_business_id ON public.communications(business_id);
