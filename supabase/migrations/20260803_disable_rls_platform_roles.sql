-- Fix: Disable RLS on platform_user_roles to prevent recursion
-- This table is for platform admin access only

-- Drop all existing policies first
DROP POLICY IF EXISTS platform_user_roles_self_read ON platform_user_roles;
DROP POLICY IF EXISTS platform_user_roles_admin_manage ON platform_user_roles;
DROP POLICY IF EXISTS platform_user_roles_select_own ON platform_user_roles;
DROP POLICY IF EXISTS platform_user_roles_all_manage ON platform_user_roles;

-- Disable RLS on this table
ALTER TABLE platform_user_roles DISABLE ROW LEVEL SECURITY;

-- Add comment explaining why
COMMENT ON TABLE platform_user_roles IS 'Platform admin roles - RLS disabled to prevent recursion. Access controlled at application level.';
