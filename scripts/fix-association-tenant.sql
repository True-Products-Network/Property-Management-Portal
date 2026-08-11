-- Fix the All Things Exemplary association to have correct tenant_id
-- Run this in Supabase SQL Editor

-- First, find the tenant ID for "All Things Exemplary"
SELECT id, name FROM tenants WHERE name = 'All Things Exemplary';

-- Then update the association (replace TENANT_ID with actual ID from above)
UPDATE associations 
SET tenant_id = 'TENANT_ID_HERE'
WHERE name = 'All Things Exemplary' 
AND tenant_id IS NULL;
