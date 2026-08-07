-- Fix approvals table FK constraints to reference portal_users instead of contacts
-- Approvals should be linked to the logged-in portal user, not just a contact

-- Drop existing FK constraints
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
