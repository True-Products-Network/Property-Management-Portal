-- Check associations and their tenant assignments
SELECT 
    a.id,
    a.name,
    a.association_id,
    a.tenant_id,
    a.business_id,
    t.name as tenant_name,
    b.name as business_name
FROM associations a
LEFT JOIN tenants t ON a.tenant_id = t.id
LEFT JOIN businesses b ON a.business_id = b.id
ORDER BY a.tenant_id, a.name;
