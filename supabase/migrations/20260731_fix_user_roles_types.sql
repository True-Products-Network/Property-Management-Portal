-- Fix user_roles table to use UUID for association_id
-- This aligns with the associations table primary key type

-- First, drop the existing index
DROP INDEX IF EXISTS idx_user_roles_association;

-- Change association_id from TEXT to UUID
-- Note: This will fail if there are existing non-UUID values
ALTER TABLE user_roles 
ALTER COLUMN association_id TYPE UUID 
USING association_id::UUID;

-- Recreate the index
CREATE INDEX idx_user_roles_association ON user_roles(association_id);

-- Also change property_id and unit_id if they exist and need to be UUID
ALTER TABLE user_roles 
ALTER COLUMN property_id TYPE UUID 
USING property_id::UUID;

ALTER TABLE user_roles 
ALTER COLUMN unit_id TYPE UUID 
USING unit_id::UUID;

ALTER TABLE user_roles 
ALTER COLUMN vendor_id TYPE UUID 
USING vendor_id::UUID;

-- Update indexes
DROP INDEX IF EXISTS idx_user_roles_property;
DROP INDEX IF EXISTS idx_user_roles_unit;
DROP INDEX IF EXISTS idx_user_roles_vendor;

CREATE INDEX idx_user_roles_property ON user_roles(property_id);
CREATE INDEX idx_user_roles_unit ON user_roles(unit_id);
CREATE INDEX idx_user_roles_vendor ON user_roles(vendor_id);
