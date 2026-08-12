-- Add is_default_seed column to tables that should have global defaults
-- This allows seed data to be shared across all tenants

-- 1. Add is_default_seed to workflows
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS is_default_seed BOOLEAN DEFAULT FALSE;

-- 2. Add is_default_seed to dropdown_settings  
ALTER TABLE dropdown_settings ADD COLUMN IF NOT EXISTS is_default_seed BOOLEAN DEFAULT FALSE;

-- 3. Add is_default_seed to ghl_role_mappings
ALTER TABLE ghl_role_mappings ADD COLUMN IF NOT EXISTS is_default_seed BOOLEAN DEFAULT FALSE;

-- 4. Add is_default_seed to roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_default_seed BOOLEAN DEFAULT FALSE;

-- 5. Add is_default_seed to permissions
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_default_seed BOOLEAN DEFAULT FALSE;

-- Mark existing data as default seed data
-- Workflows (currently linked to Default Business)
UPDATE workflows SET is_default_seed = TRUE WHERE business_id = '11af1d64-90a0-4d86-9005-46d089db1469';

-- GHL Role Mappings (currently global with no tenant link)
UPDATE ghl_role_mappings SET is_default_seed = TRUE;

-- Roles that are system roles (no tenant_id)
UPDATE roles SET is_default_seed = TRUE WHERE tenant_id IS NULL;

-- Permissions (global table)
UPDATE permissions SET is_default_seed = TRUE;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_workflows_default_seed ON workflows(is_default_seed) WHERE is_default_seed = TRUE;
CREATE INDEX IF NOT EXISTS idx_dropdown_settings_default_seed ON dropdown_settings(is_default_seed) WHERE is_default_seed = TRUE;
CREATE INDEX IF NOT EXISTS idx_ghl_role_mappings_default_seed ON ghl_role_mappings(is_default_seed) WHERE is_default_seed = TRUE;
CREATE INDEX IF NOT EXISTS idx_roles_default_seed ON roles(is_default_seed) WHERE is_default_seed = TRUE;
CREATE INDEX IF NOT EXISTS idx_permissions_default_seed ON permissions(is_default_seed) WHERE is_default_seed = TRUE;
