-- Fix Platform Admin RLS Issues
-- Date: August 11, 2026
-- Issue: The 20260811_fix_rls_issues.sql migration added tenant-only policies
--        that blocked platform users from accessing tenant data

-- ============================================================================
-- Helper Functions (ensure they exist)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'PLATFORM_ADMIN'
        AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_platform_support()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
        AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Fix 1: platform_user_roles - Allow platform admins to see all platform users
-- ============================================================================

DROP POLICY IF EXISTS "platform_user_roles_user_isolation" ON public.platform_user_roles;
DROP POLICY IF EXISTS "platform_user_roles_admin_all" ON public.platform_user_roles;

-- Platform admins can manage all platform user roles
CREATE POLICY "platform_user_roles_admin_manage"
  ON public.platform_user_roles
  FOR ALL
  USING (is_platform_support());

-- Users can see their own platform roles
CREATE POLICY "platform_user_roles_self_read"
  ON public.platform_user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- Fix 2: tenants - Allow platform support to access all tenants
-- ============================================================================

DROP POLICY IF EXISTS "tenants_tenant_isolation" ON public.tenants;

-- Platform support can access all tenants
CREATE POLICY "tenants_platform_support"
  ON public.tenants
  FOR ALL
  USING (is_platform_support());

-- Tenant admins can see their own tenant (only if policy doesn't exist)
DROP POLICY IF EXISTS "tenants_tenant_admin" ON public.tenants;
CREATE POLICY "tenants_tenant_admin"
  ON public.tenants
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM tenant_users WHERE tenant_id = tenants.id AND user_id = auth.uid())
  );

-- ============================================================================
-- Fix 3: tenant_entitlements - Allow platform support access
-- ============================================================================

DROP POLICY IF EXISTS "tenant_entitlements_tenant_isolation" ON public.tenant_entitlements;

-- Platform support can manage all entitlements
CREATE POLICY "tenant_entitlements_platform_support"
  ON public.tenant_entitlements
  FOR ALL
  USING (is_platform_support());

-- Tenant admins can see their own entitlements
CREATE POLICY "tenant_entitlements_tenant_admin"
  ON public.tenant_entitlements
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM tenant_users WHERE tenant_id = tenant_entitlements.tenant_id AND user_id = auth.uid())
  );

-- ============================================================================
-- Fix 4: platform_audit_events - Allow platform support access
-- ============================================================================

DROP POLICY IF EXISTS "platform_audit_events_tenant_isolation" ON public.platform_audit_events;

-- Platform support can access all audit events
CREATE POLICY "platform_audit_platform_support"
  ON public.platform_audit_events
  FOR ALL
  USING (is_platform_support());

-- ============================================================================
-- Fix 5: association_ghl_connections - Allow platform support access
-- ============================================================================

DROP POLICY IF EXISTS "association_ghl_connections_tenant_isolation" ON public.association_ghl_connections;

-- Platform support can access all GHL connections
CREATE POLICY "association_ghl_platform_support"
  ON public.association_ghl_connections
  FOR ALL
  USING (is_platform_support());

-- Tenant users can see their own connections via associations
CREATE POLICY "association_ghl_tenant_member"
  ON public.association_ghl_connections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM associations 
      WHERE id = association_ghl_connections.association_id 
      AND tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- Fix 6: tenant_subscriptions - Allow platform support access
-- ============================================================================

DROP POLICY IF EXISTS "tenant_subscriptions_tenant_isolation" ON public.tenant_subscriptions;
DROP POLICY IF EXISTS "tenant_subscriptions_tenant_admin" ON public.tenant_subscriptions;

-- Platform support can manage all subscriptions
CREATE POLICY "tenant_subscriptions_platform_support"
  ON public.tenant_subscriptions
  FOR ALL
  USING (is_platform_support());

-- Tenant admins can see their own subscriptions
CREATE POLICY "tenant_subscriptions_tenant_admin"
  ON public.tenant_subscriptions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM tenant_users WHERE tenant_id = tenant_subscriptions.tenant_id AND user_id = auth.uid())
  );

-- ============================================================================
-- Fix 7: tenant_users - Allow platform support to manage tenant users
-- ============================================================================

DROP POLICY IF EXISTS "tenant_users_tenant_isolation" ON public.tenant_users;

-- Platform support can manage all tenant users
CREATE POLICY "tenant_users_platform_support"
  ON public.tenant_users
  FOR ALL
  USING (is_platform_support());

-- Users can see their own tenant user records
CREATE POLICY "tenant_users_self_read"
  ON public.tenant_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Tenant admins can see users in their tenant
CREATE POLICY "tenant_users_tenant_admin"
  ON public.tenant_users
  FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- Fix 8: support_access_sessions - Allow platform support access
-- ============================================================================

DROP POLICY IF EXISTS "support_sessions_tenant_isolation" ON public.support_access_sessions;

-- Platform support can manage support sessions
CREATE POLICY "support_sessions_platform_support"
  ON public.support_access_sessions
  FOR ALL
  USING (is_platform_support());

-- ============================================================================
-- Fix 9: billing_events - Allow platform support access
-- ============================================================================

DROP POLICY IF EXISTS "billing_events_tenant_isolation" ON public.billing_events;

-- Platform support can access all billing events
CREATE POLICY "billing_events_platform_support"
  ON public.billing_events
  FOR ALL
  USING (is_platform_support());

-- ============================================================================
-- Fix 10: tenant_usage - Allow platform support access
-- ============================================================================

DROP POLICY IF EXISTS "tenant_usage_tenant_isolation" ON public.tenant_usage;

-- Platform support can access all tenant usage
CREATE POLICY "tenant_usage_platform_support"
  ON public.tenant_usage
  FOR ALL
  USING (is_platform_support());

-- ============================================================================
-- Fix 11: Ensure core tenant data tables allow platform support
-- ============================================================================

-- associations
DROP POLICY IF EXISTS "associations_tenant_isolation" ON public.associations;
CREATE POLICY "associations_platform_support"
  ON public.associations
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- properties
DROP POLICY IF EXISTS "properties_tenant_isolation" ON public.properties;
CREATE POLICY "properties_platform_support"
  ON public.properties
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- contacts
DROP POLICY IF EXISTS "contacts_tenant_isolation" ON public.contacts;
CREATE POLICY "contacts_platform_support"
  ON public.contacts
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- vendors
DROP POLICY IF EXISTS "vendors_tenant_isolation" ON public.vendors;
CREATE POLICY "vendors_platform_support"
  ON public.vendors
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- units
DROP POLICY IF EXISTS "units_tenant_isolation" ON public.units;
CREATE POLICY "units_platform_support"
  ON public.units
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- maintenance_requests
DROP POLICY IF EXISTS "maintenance_tenant_isolation" ON public.maintenance_requests;
CREATE POLICY "maintenance_platform_support"
  ON public.maintenance_requests
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- inspections
DROP POLICY IF EXISTS "inspections_tenant_isolation" ON public.inspections;
CREATE POLICY "inspections_platform_support"
  ON public.inspections
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- documents
DROP POLICY IF EXISTS "documents_tenant_isolation" ON public.documents;
CREATE POLICY "documents_platform_support"
  ON public.documents
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- approvals
DROP POLICY IF EXISTS "approvals_tenant_isolation" ON public.approvals;
CREATE POLICY "approvals_platform_support"
  ON public.approvals
  FOR ALL
  USING (
    is_platform_support()
    OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Summary of changes:
-- 1. Added is_platform_support() checks to all platform admin tables
-- 2. Fixed tenant_entitlements RLS for platform support
-- 3. Fixed platform_audit_events RLS for platform support
-- 4. Fixed association_ghl_connections RLS for platform support
-- 5. Fixed tenant_subscriptions RLS for platform support
-- 6. Fixed tenant_users RLS for platform support
-- 7. Fixed support_access_sessions RLS for platform support
-- 8. Fixed billing_events RLS for platform support
-- 9. Fixed tenant_usage RLS for platform support
-- 10. Fixed all core tenant data tables for platform support access
-- ============================================================================
