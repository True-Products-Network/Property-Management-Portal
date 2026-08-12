-- Check the Default Business
SELECT 
    id,
    name,
    slug as tenant_id,
    status,
    created_at
FROM businesses
WHERE id = '11af1d64-90a0-4d86-9005-46d089db1469';

-- Check which tenant this business belongs to
SELECT 
    b.id,
    b.name as business_name,
    b.slug,
    t.id as tenant_id,
    t.name as tenant_name
FROM businesses b
LEFT JOIN tenants t ON b.slug = t.id::text
WHERE b.id = '11af1d64-90a0-4d86-9005-46d089db1469';
