-- Add name columns to approvals for audit trail
-- This captures the user's name at the time of the action

ALTER TABLE approvals 
ADD COLUMN IF NOT EXISTS requested_by_name TEXT,
ADD COLUMN IF NOT EXISTS approved_by_name TEXT,
ADD COLUMN IF NOT EXISTS denied_by_name TEXT;

-- Add comments explaining the purpose
COMMENT ON COLUMN approvals.requested_by_name IS 'Name of user who requested approval (captured at time of request for audit)';
COMMENT ON COLUMN approvals.approved_by_name IS 'Name of user who approved (captured at time of approval for audit)';
COMMENT ON COLUMN approvals.denied_by_name IS 'Name of user who denied (captured at time of denial for audit)';
