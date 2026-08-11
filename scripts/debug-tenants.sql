-- Debug tenant/business relationships
-- Run this in Supabase SQL Editor

-- 1. Get all tenants with their IDs
SELECT id, name, subdomain, created_at 
FROM tenants 
ORDER BY created_at;

-- 2. Get all businesses with their slug (tenant_id link)
SELECT b.id, b.name, b.slug as tenant_id, t.name as tenant_name, b.created_at
FROM businesses b
LEFT JOIN tenants t ON b.slug = t.id::text
ORDER BY b.slug, b.created_at;

-- 3. Get user's tenant associations
-- Replace with actual user ID
SELECT tu.user_id, tu.tenant_id, t.name as tenant_name, tu.role
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.user_id = 'YOUR_USER_ID_HERE';

-- 4. Get user's contact tenant associations
SELECT c.portal_user_id, c.tenant_id, t.name as tenant_name
FROM contacts c
JOIN tenants t ON c.tenant_id = t.id
WHERE c.portal_user_id = 'YOUR_USER_ID_HERE';

-- 5. Count businesses per tenant
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    COUNT(b.id) as business_count
FROM tenants t
LEFT JOIN businesses b ON b.slug = t.id::text
GROUP BY t.id, t.name
ORDER BY t.name;
