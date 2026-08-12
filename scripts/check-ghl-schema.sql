-- Check GHL Role Mappings and Workflow Settings schema

-- 1. Check GHL Role Mappings structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ghl_role_mappings'
ORDER BY ordinal_position;

-- 2. Check all GHL Role Mappings data
SELECT * FROM ghl_role_mappings;

-- 3. Check Workflow Settings structure  
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workflow_settings'
ORDER BY ordinal_position;

-- 4. Check all Workflow Settings data
SELECT * FROM workflow_settings;
