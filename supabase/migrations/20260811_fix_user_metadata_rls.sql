-- Fix RLS policies that reference user_metadata (security issue)
-- user_metadata is editable by end users and should not be used in security policies

-- First, let's see what policies exist (for debugging)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename IN ('compliance_matters', 'payment_records', 'communications');

-- Drop ALL policies on these tables to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on compliance_matters
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'compliance_matters'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.compliance_matters', pol.policyname);
    END LOOP;
    
    -- Drop all policies on payment_records
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'payment_records'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_records', pol.policyname);
    END LOOP;
    
    -- Drop all policies on communications
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'communications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.communications', pol.policyname);
    END LOOP;
END $$;

-- Create secure policies using proper type casting
-- slug is text, tenant_id is uuid - cast slug to uuid for comparison

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
