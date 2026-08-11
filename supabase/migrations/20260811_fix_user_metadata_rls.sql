-- Fix RLS policies that reference user_metadata (security issue)
-- user_metadata is editable by end users and should not be used in security policies

-- Drop existing policies that reference user_metadata
DROP POLICY IF EXISTS "compliance_tenant_isolation" ON public.compliance_matters;
DROP POLICY IF EXISTS "payments_tenant_isolation" ON public.payment_records;
DROP POLICY IF EXISTS "communications_tenant_isolation" ON public.communications;

-- Create policies directly without helper functions
-- This avoids any cached function issues

-- Compliance Matters - secure policy
CREATE POLICY "compliance_tenant_isolation"
  ON public.compliance_matters
  FOR ALL
  USING (
    business_id IN (
      SELECT b.id::text 
      FROM businesses b
      INNER JOIN tenant_users tu ON b.slug::uuid = tu.tenant_id
      WHERE tu.user_id = auth.uid()
    )
  );

-- Payment Records - secure policy
CREATE POLICY "payments_tenant_isolation"
  ON public.payment_records
  FOR ALL
  USING (
    business_id IN (
      SELECT b.id::text 
      FROM businesses b
      INNER JOIN tenant_users tu ON b.slug::uuid = tu.tenant_id
      WHERE tu.user_id = auth.uid()
    )
  );

-- Communications - secure policy
CREATE POLICY "communications_tenant_isolation"
  ON public.communications
  FOR ALL
  USING (
    business_id IN (
      SELECT b.id::text 
      FROM businesses b
      INNER JOIN tenant_users tu ON b.slug::uuid = tu.tenant_id
      WHERE tu.user_id = auth.uid()
    )
  );

-- Add indexes to improve performance of these lookups
CREATE INDEX IF NOT EXISTS idx_compliance_matters_business_id ON public.compliance_matters(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_business_id ON public.payment_records(business_id);
CREATE INDEX IF NOT EXISTS idx_communications_business_id ON public.communications(business_id);
