-- The existing user_roles table has a different structure
-- Rename it to preserve existing data, then create the new table

-- Rename existing table to preserve data
ALTER TABLE IF EXISTS user_roles RENAME TO user_roles_legacy;

-- Also rename the indexes
ALTER INDEX IF EXISTS idx_user_roles_user RENAME TO idx_user_roles_legacy_user;
ALTER INDEX IF EXISTS idx_user_roles_tenant RENAME TO idx_user_roles_legacy_tenant;
ALTER INDEX IF EXISTS idx_user_roles_role RENAME TO idx_user_roles_legacy_role;

-- Drop old RLS policy if exists
DROP POLICY IF EXISTS user_roles_tenant_isolation ON user_roles_legacy;

-- Create new user_roles table with correct structure
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, tenant_id, role_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY user_roles_tenant_isolation ON user_roles
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );
