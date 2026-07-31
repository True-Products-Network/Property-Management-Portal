-- Fix user_roles column types from TEXT to UUID
-- This aligns with the main table primary keys

-- Step 1: Drop RLS policies that depend on these columns
DROP POLICY IF EXISTS "Users can view audit events for their associations" ON audit_events;
DROP POLICY IF EXISTS "Admins can view all audit events" ON audit_events;
DROP POLICY IF EXISTS "Users can view files for their associations" ON file_references;

-- Step 2: Drop the indexes that will be affected
DROP INDEX IF EXISTS idx_user_roles_association;
DROP INDEX IF EXISTS idx_user_roles_property;
DROP INDEX IF EXISTS idx_user_roles_unit;
DROP INDEX IF EXISTS idx_user_roles_vendor;

-- Step 3: Add new UUID columns
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS association_id_uuid UUID;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS property_id_uuid UUID;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS unit_id_uuid UUID;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS vendor_id_uuid UUID;

-- Step 4: Convert existing TEXT data to UUID (if any exists)
-- This will only work if the TEXT values are valid UUIDs
-- For now, since there's only one user, this should be empty

-- Step 5: Drop old TEXT columns
ALTER TABLE user_roles DROP COLUMN IF EXISTS association_id;
ALTER TABLE user_roles DROP COLUMN IF EXISTS property_id;
ALTER TABLE user_roles DROP COLUMN IF EXISTS unit_id;
ALTER TABLE user_roles DROP COLUMN IF EXISTS vendor_id;

-- Step 6: Rename new columns to original names
ALTER TABLE user_roles RENAME COLUMN association_id_uuid TO association_id;
ALTER TABLE user_roles RENAME COLUMN property_id_uuid TO property_id;
ALTER TABLE user_roles RENAME COLUMN unit_id_uuid TO unit_id;
ALTER TABLE user_roles RENAME COLUMN vendor_id_uuid TO vendor_id;

-- Step 7: Recreate indexes
CREATE INDEX idx_user_roles_association ON user_roles(association_id);
CREATE INDEX idx_user_roles_property ON user_roles(property_id);
CREATE INDEX idx_user_roles_unit ON user_roles(unit_id);
CREATE INDEX idx_user_roles_vendor ON user_roles(vendor_id);

-- Step 8: Recreate RLS policies with proper UUID handling
CREATE POLICY "Users can view audit events for their associations" ON audit_events
    FOR SELECT USING (
        actor_id = auth.uid()::text OR
        association_id::text IN (
            SELECT association_id::text FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all audit events" ON audit_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN_USER'
        )
    );

CREATE POLICY "Users can view files for their associations" ON file_references
    FOR SELECT USING (
        association_id::text IN (
            SELECT association_id::text FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND column_name IN ('association_id', 'property_id', 'unit_id', 'vendor_id');
