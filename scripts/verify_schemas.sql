-- Verify table schemas for tenant seeding

-- Check dropdown_settings columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'dropdown_settings' 
ORDER BY ordinal_position;

-- Check ghl_role_mappings columns  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ghl_role_mappings'
ORDER BY ordinal_position;

-- Check workflows columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'workflows'
ORDER BY ordinal_position;

-- Check roles columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'roles'
ORDER BY ordinal_position;

-- Check if tenant_id exists in each table
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'tenant_id' 
AND table_name IN ('dropdown_settings', 'ghl_role_mappings', 'workflows', 'roles', 'permissions');
