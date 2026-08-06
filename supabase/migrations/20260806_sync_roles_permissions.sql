-- Migration: Sync portal_roles permissions to roles table
-- Adds JSONB permissions column to roles and copies data from portal_roles

-- Step 1: Add permissions JSONB column to roles table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'permissions' AND table_schema = 'public'
    ) THEN
        ALTER TABLE roles ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Step 2: Add requires_mfa column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'requires_mfa' AND table_schema = 'public'
    ) THEN
        ALTER TABLE roles ADD COLUMN requires_mfa BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Step 3: Copy permissions from portal_roles to roles (matching by name)
UPDATE roles r
SET 
    permissions = pr.permissions,
    requires_mfa = pr.requires_mfa
FROM portal_roles pr
WHERE r.name = pr.name;

-- Step 4: Verify the sync
SELECT 
    r.name,
    r.permissions->0->>'module' as first_permission_module,
    r.requires_mfa,
    jsonb_array_length(r.permissions) as permission_count
FROM roles r
ORDER BY r.name;

-- Step 5: Show any roles that didn't get synced
SELECT r.name, r.id
FROM roles r
WHERE r.permissions IS NULL OR r.permissions = '[]'::jsonb;
