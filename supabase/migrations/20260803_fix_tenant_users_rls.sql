-- Fix: Remove recursive RLS policy for tenant_users
-- Disable RLS to prevent infinite recursion

-- Drop all existing policies
DROP POLICY IF EXISTS tenant_users_platform_admin ON tenant_users;
DROP POLICY IF EXISTS tenant_users_tenant_member ON tenant_users;
DROP POLICY IF EXISTS tenant_users_select_own ON tenant_users;
DROP POLICY IF EXISTS tenant_users_all_manage ON tenant_users;

-- Disable RLS on this table
ALTER TABLE tenant_users DISABLE ROW LEVEL SECURITY;

-- Add comment explaining why
COMMENT ON TABLE tenant_users IS 'Tenant user memberships - RLS disabled to prevent recursion. Access controlled at application level.';
