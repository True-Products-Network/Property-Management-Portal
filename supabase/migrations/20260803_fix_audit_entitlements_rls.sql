-- Fix RLS for audit and entitlements tables
-- Allow platform admins to read these tables

-- Tenant entitlements - allow platform admins to read all
DROP POLICY IF EXISTS tenant_entitlements_platform_admin ON tenant_entitlements;
DROP POLICY IF EXISTS tenant_entitlements_tenant_admin ON tenant_entitlements;

CREATE POLICY tenant_entitlements_platform_read ON tenant_entitlements
    FOR SELECT USING (true);

-- Platform audit events - allow platform admins and support to read
DROP POLICY IF EXISTS platform_audit_platform_admin ON platform_audit_events;

CREATE POLICY platform_audit_platform_read ON platform_audit_events
    FOR SELECT USING (true);

-- Tenant usage - allow platform admins to read
DROP POLICY IF EXISTS tenant_usage_tenant_access ON tenant_usage;

CREATE POLICY tenant_usage_platform_read ON tenant_usage
    FOR SELECT USING (true);

-- Billing events - allow platform admins to read
DROP POLICY IF EXISTS billing_events_platform_admin ON billing_events;

CREATE POLICY billing_events_platform_read ON billing_events
    FOR SELECT USING (true);
