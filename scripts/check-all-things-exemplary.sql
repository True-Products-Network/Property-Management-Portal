-- Check business_id for All Things Exemplary association
SELECT 
    a.id,
    a.name,
    a.association_id,
    a.tenant_id,
    a.business_id,
    b.name as business_name,
    t.name as tenant_name
FROM associations a
LEFT JOIN businesses b ON a.business_id = b.id
LEFT JOIN tenants t ON a.tenant_id = t.id
WHERE a.name = 'All Things Exemplary';
