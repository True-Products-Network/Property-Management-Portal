-- Add is_admin column to portal_users for database-level admin checks
-- This avoids RLS recursion issues when checking admin status

-- Add is_admin column
ALTER TABLE portal_users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_portal_users_is_admin ON portal_users(is_admin) WHERE is_admin = true;

-- Update existing admin users based on user_roles
-- This sets is_admin=true for any user with ADMIN_USER role
UPDATE portal_users 
SET is_admin = true 
WHERE id IN (
    SELECT DISTINCT user_id 
    FROM user_roles 
    WHERE role = 'ADMIN_USER' 
    AND revoked_at IS NULL
);

-- Add comment
COMMENT ON COLUMN portal_users.is_admin IS 'Database-level admin flag for RLS policies and quick admin checks';
