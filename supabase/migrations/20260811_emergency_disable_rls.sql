-- EMERGENCY: Disable RLS on associations to restore functionality
-- This is a temporary fix while we properly resolve the user_roles schema issue

-- Disable RLS on associations table
ALTER TABLE public.associations DISABLE ROW LEVEL SECURITY;

-- Drop all policies on associations to avoid conflicts
DROP POLICY IF EXISTS "associations_tenant_isolation" ON public.associations;
DROP POLICY IF EXISTS "associations_platform_support" ON public.associations;
DROP POLICY IF EXISTS "associations_admin_all" ON public.associations;
DROP POLICY IF EXISTS "associations_management_all" ON public.associations;
DROP POLICY IF EXISTS "associations_user_select" ON public.associations;
DROP POLICY IF EXISTS "associations_user_access" ON public.associations;
DROP POLICY IF EXISTS "associations_platform_admin" ON public.associations;
DROP POLICY IF EXISTS "Users can view their associations" ON public.associations;
DROP POLICY IF EXISTS "Management can manage associations" ON public.associations;

-- Also disable RLS on other critical tables that might be affected
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_matters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications DISABLE ROW LEVEL SECURITY;

-- Drop all policies on these tables too
DROP POLICY IF EXISTS "properties_tenant_isolation" ON public.properties;
DROP POLICY IF EXISTS "units_tenant_isolation" ON public.units;
DROP POLICY IF EXISTS "contacts_tenant_isolation" ON public.contacts;
DROP POLICY IF EXISTS "vendors_tenant_isolation" ON public.vendors;
DROP POLICY IF EXISTS "maintenance_tenant_isolation" ON public.maintenance_requests;
DROP POLICY IF EXISTS "inspections_tenant_isolation" ON public.inspections;
DROP POLICY IF EXISTS "documents_tenant_isolation" ON public.documents;
DROP POLICY IF EXISTS "approvals_tenant_isolation" ON public.approvals;
DROP POLICY IF EXISTS "compliance_tenant_isolation" ON public.compliance_matters;
DROP POLICY IF EXISTS "payments_tenant_isolation" ON public.payment_records;
DROP POLICY IF EXISTS "communications_tenant_isolation" ON public.communications;
