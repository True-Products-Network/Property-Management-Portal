-- Fix associations with NULL tenant_id
-- Run this in Supabase SQL Editor

-- Find associations with NULL tenant_id
SELECT 
    a.id,
    a.name,
    a.association_id,
    a.tenant_id,
    a.business_id,
    a.created_at
FROM associations a
WHERE a.tenant_id IS NULL;

-- Update the All Things Exemplary association to have correct tenant_id
-- Replace with the actual tenant ID for All Things Exemplary
UPDATE associations 
SET tenant_id = 'b45cfdb9-9cd7-49d2-a90f-73624114b666'
WHERE association_id = 'ASSOC-1786488757035'
AND tenant_id IS NULL;

-- Verify the fix
SELECT 
    a.id,
    a.name,
    a.tenant_id,
    t.name as tenant_name
FROM associations a
LEFT JOIN tenants t ON a.tenant_id = t.id
WHERE a.association_id = 'ASSOC-1786488757035';
