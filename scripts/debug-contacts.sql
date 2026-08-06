-- Debug contacts to see why some didn't set up correctly
-- Run this in Supabase SQL Editor

-- 1. Show all contacts with their tenant info
SELECT 
    c.id,
    c.contact_id,
    c.first_name,
    c.last_name,
    c.email,
    c.tenant_id,
    t.name as tenant_name,
    c.portal_user_id,
    c.allow_login,
    c.portal_invitation_status,
    c.created_at
FROM contacts c
LEFT JOIN tenants t ON c.tenant_id = t.id
ORDER BY c.tenant_id NULLS FIRST, c.created_at DESC;

-- 2. Show contacts with missing tenant_id (these are the problem ones)
SELECT 
    c.id,
    c.contact_id,
    c.first_name,
    c.last_name,
    c.email,
    c.tenant_id,
    c.portal_user_id,
    c.created_at
FROM contacts c
WHERE c.tenant_id IS NULL
ORDER BY c.created_at DESC;

-- 3. Show contacts with missing portal_user_id
SELECT 
    c.id,
    c.contact_id,
    c.first_name,
    c.last_name,
    c.email,
    c.tenant_id,
    c.portal_user_id,
    c.created_at
FROM contacts c
WHERE c.portal_user_id IS NULL
ORDER BY c.created_at DESC;

-- 4. Count contacts by tenant
SELECT 
    COALESCE(t.name, 'NO TENANT') as tenant_name,
    COUNT(*) as contact_count
FROM contacts c
LEFT JOIN tenants t ON c.tenant_id = t.id
GROUP BY t.name
ORDER BY contact_count DESC;

-- 5. Show tenant_users without corresponding contacts
SELECT 
    tu.user_id,
    tu.tenant_id,
    t.name as tenant_name,
    u.email as user_email
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
JOIN auth.users u ON u.id = tu.user_id
LEFT JOIN contacts c ON c.portal_user_id = tu.user_id
WHERE c.id IS NULL;
