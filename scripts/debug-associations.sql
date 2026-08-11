-- Debug associations and their business_id values
-- Run this in Supabase SQL Editor

-- 1. Get all associations with their business_id
SELECT 
    a.id,
    a.name,
    a.association_id,
    a.business_id,
    b.name as business_name,
    b.slug as business_tenant_id
FROM associations a
LEFT JOIN businesses b ON a.business_id = b.id
ORDER BY a.business_id, a.name;

-- 2. Count associations per business
SELECT 
    b.id as business_id,
    b.name as business_name,
    COUNT(a.id) as association_count
FROM businesses b
LEFT JOIN associations a ON a.business_id = b.id
GROUP BY b.id, b.name
ORDER BY b.name;

-- 3. Get associations for specific business IDs
-- Replace with actual business IDs from your tenants
SELECT * FROM associations 
WHERE business_id IN (
    '77df114c-ce0f-4462-8d72-702229ff8cf9',  -- Test-True Products Network
    '11af1d64-90a0-4d86-9005-46d089db1469'   -- Default Business
);
