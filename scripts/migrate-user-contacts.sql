-- Migration: Create missing contact records for existing tenant users
-- Run this in Supabase SQL Editor

-- First, create a temporary function to get user metadata
CREATE OR REPLACE FUNCTION get_user_metadata(user_uuid UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (SELECT raw_user_meta_data FROM auth.users WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create contacts for users in tenant_users who don't have a contact record
INSERT INTO contacts (
    contact_id,
    first_name,
    last_name,
    email,
    phone,
    email_permission,
    tenant_id,
    portal_user_id,
    allow_login,
    portal_invitation_status,
    created_at,
    updated_at
)
SELECT 
    'CNT-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 9),
    COALESCE(
        get_user_metadata(tu.user_id)->>'first_name',
        SPLIT_PART(
            COALESCE(get_user_metadata(tu.user_id)->>'full_name', 'Unknown User'),
            ' ',
            1
        )
    ),
    COALESCE(
        get_user_metadata(tu.user_id)->>'last_name',
        SPLIT_PART(
            COALESCE(get_user_metadata(tu.user_id)->>'full_name', 'Unknown User'),
            ' ',
            2
        )
    ),
    (SELECT email FROM auth.users WHERE id = tu.user_id),
    get_user_metadata(tu.user_id)->>'phone',
    true,
    tu.tenant_id,
    tu.user_id,
    CASE 
        WHEN tu.role = 'admin' OR tu.is_primary_admin = true THEN true 
        ELSE false 
    END,
    CASE 
        WHEN tu.role = 'admin' OR tu.is_primary_admin = true THEN 'ACTIVE' 
        ELSE 'INVITED' 
    END,
    NOW(),
    NOW()
FROM tenant_users tu
WHERE NOT EXISTS (
    SELECT 1 FROM contacts c 
    WHERE c.portal_user_id = tu.user_id
)
AND EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = tu.user_id
);

-- Drop the temporary function
DROP FUNCTION IF EXISTS get_user_metadata(UUID);

-- Show results
SELECT 
    'Migration complete' as status,
    COUNT(*) as total_contacts,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '5 minutes') as newly_created
FROM contacts;
