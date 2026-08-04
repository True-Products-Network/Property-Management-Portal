-- Fix tenant deletion by adding ON DELETE CASCADE to foreign keys
-- This allows tenants to be deleted along with their related records

-- ============================================
-- Fix platform_audit_events foreign key
-- ============================================
ALTER TABLE platform_audit_events
DROP CONSTRAINT IF EXISTS platform_audit_events_tenant_id_fkey;

ALTER TABLE platform_audit_events
ADD CONSTRAINT platform_audit_events_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================
-- Fix support_access_sessions foreign key
-- ============================================
ALTER TABLE support_access_sessions
DROP CONSTRAINT IF EXISTS support_access_sessions_tenant_id_fkey;

ALTER TABLE support_access_sessions
ADD CONSTRAINT support_access_sessions_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================
-- Fix tenant_subscriptions foreign key
-- ============================================
ALTER TABLE tenant_subscriptions
DROP CONSTRAINT IF EXISTS tenant_subscriptions_tenant_id_fkey;

ALTER TABLE tenant_subscriptions
ADD CONSTRAINT tenant_subscriptions_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================
-- Fix tenant_users foreign key
-- ============================================
ALTER TABLE tenant_users
DROP CONSTRAINT IF EXISTS tenant_users_tenant_id_fkey;

ALTER TABLE tenant_users
ADD CONSTRAINT tenant_users_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================
-- Fix portfolios foreign key
-- ============================================
ALTER TABLE portfolios
DROP CONSTRAINT IF EXISTS portfolios_tenant_id_fkey;

ALTER TABLE portfolios
ADD CONSTRAINT portfolios_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================
-- Fix tenant_usage foreign key
-- ============================================
ALTER TABLE tenant_usage
DROP CONSTRAINT IF EXISTS tenant_usage_tenant_id_fkey;

ALTER TABLE tenant_usage
ADD CONSTRAINT tenant_usage_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================
-- Fix tenant_entitlements foreign key
-- ============================================
ALTER TABLE tenant_entitlements
DROP CONSTRAINT IF EXISTS tenant_entitlements_tenant_id_fkey;

ALTER TABLE tenant_entitlements
ADD CONSTRAINT tenant_entitlements_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================
-- Fix tenant_entity_limits foreign key
-- ============================================
ALTER TABLE tenant_entity_limits
DROP CONSTRAINT IF EXISTS tenant_entity_limits_tenant_id_fkey;

ALTER TABLE tenant_entity_limits
ADD CONSTRAINT tenant_entity_limits_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
