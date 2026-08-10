-- Diagnose dropdown_settings issues

-- Check what Inspection/Approval dropdowns exist
SELECT id, tenant_id, record_type, field_name, value, label, is_active
FROM dropdown_settings 
WHERE record_type IN ('Inspection', 'Approval')
ORDER BY record_type, field_name, value;

-- Check the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'dropdown_settings'::regclass
AND contype = 'u';

-- Check if tenant_id is correct
SELECT id, name, subdomain
FROM tenants
WHERE id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b';
