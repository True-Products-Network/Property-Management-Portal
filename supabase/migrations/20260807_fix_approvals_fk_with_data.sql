-- Fix approvals table FK constraints to reference portal_users
-- This migration handles existing data by mapping contact IDs to portal_user IDs

-- First, add a temporary column to store the portal_user_id
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS temp_portal_user_id UUID;

-- Update existing approvals to map contact IDs to portal_user IDs
-- This assumes contacts have a portal_user_id field
UPDATE approvals a
SET temp_portal_user_id = c.portal_user_id
FROM contacts c
WHERE a.requested_by = c.id
AND a.temp_portal_user_id IS NULL;

-- For any approvals where we couldn't find a portal_user, set to NULL
-- (these will need to be manually fixed or the approvals deleted)
UPDATE approvals 
SET requested_by = NULL
WHERE temp_portal_user_id IS NULL
AND requested_by IS NOT NULL;

-- Update requested_by to use portal_user_id
UPDATE approvals 
SET requested_by = temp_portal_user_id
WHERE temp_portal_user_id IS NOT NULL;

-- Do the same for approved_by
UPDATE approvals a
SET temp_portal_user_id = c.portal_user_id
FROM contacts c
WHERE a.approved_by = c.id
AND a.temp_portal_user_id IS NULL;

UPDATE approvals 
SET approved_by = temp_portal_user_id
WHERE temp_portal_user_id IS NOT NULL;

-- Do the same for denied_by
UPDATE approvals a
SET temp_portal_user_id = c.portal_user_id
FROM contacts c
WHERE a.denied_by = c.id
AND a.temp_portal_user_id IS NULL;

UPDATE approvals 
SET denied_by = temp_portal_user_id
WHERE temp_portal_user_id IS NOT NULL;

-- Drop the temporary column
ALTER TABLE approvals DROP COLUMN IF EXISTS temp_portal_user_id;

-- Now drop existing FK constraints
ALTER TABLE approvals 
DROP CONSTRAINT IF EXISTS approvals_requested_by_fkey,
DROP CONSTRAINT IF EXISTS approvals_approved_by_fkey,
DROP CONSTRAINT IF EXISTS approvals_denied_by_fkey;

-- Add new FK constraints referencing portal_users
ALTER TABLE approvals
ADD CONSTRAINT approvals_requested_by_fkey 
    FOREIGN KEY (requested_by) REFERENCES portal_users(id),
ADD CONSTRAINT approvals_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES portal_users(id),
ADD CONSTRAINT approvals_denied_by_fkey 
    FOREIGN KEY (denied_by) REFERENCES portal_users(id);

-- Update comments
COMMENT ON COLUMN approvals.requested_by IS 'Portal user who requested the approval';
COMMENT ON COLUMN approvals.approved_by IS 'Portal user who approved the request';
COMMENT ON COLUMN approvals.denied_by IS 'Portal user who denied the request';
