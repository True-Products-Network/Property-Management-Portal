-- Check the newly created All Things Exemplary association
SELECT 
    a.id,
    a.name,
    a.association_id,
    a.tenant_id,
    a.business_id,
    t.name as tenant_name
FROM associations a
LEFT JOIN tenants t ON a.tenant_id = t.id
WHERE a.association_id = 'ASSOC-1786488757035';
