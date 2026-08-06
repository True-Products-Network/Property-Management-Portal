-- Migration: Create missing contact records for existing tenant users
-- Run this in Supabase SQL Editor

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
        (SELECT (user_metadata->>'first_name') 
         FROM auth.users 
         WHERE id = tu.user_id),
        SPLIT_PART(
            COALESCE(
                (SELECT (user_metadata->>'full_name') 
                 FROM auth.users 
                 WHERE id = tu.user_id),
                'Unknown User'
            ),
            ' ',
            1
        )
    ),
    COALESCE(
        (SELECT (user_metadata->>'last_name') 
         FROM auth.users 
         WHERE id = tu.user_id),
        SPLIT_PART(
            COALESCE(
                (SELECT (user_metadata->>'full_name') 
                 FROM auth.users 
                 WHERE id = tu.user_id),
                'Unknown User'
            ),
            ' ',
            2
        )
    ),
    (SELECT email FROM auth.users WHERE id = tu.user_id),
    (SELECT (user_metadata->>'phone') FROM auth.users WHERE id = tu.user_id),
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

-- Show results
SELECT 
    'Migration complete' as status,
    COUNT(*) as contacts_created
FROM contacts 
WHERE created_at > NOW() - INTERVAL '5 minutes';
