-- Check GHL Role Mappings and Workflow Settings

-- 1. Check GHL Role Mappings
SELECT 
    id,
    role_name,
    ghl_role_id,
    ghl_role_name,
    tenant_id,
    is_active,
    created_at
FROM ghl_role_mappings
ORDER BY tenant_id, role_name;

-- 2. Count GHL Role Mappings per tenant
SELECT 
    tenant_id,
    COUNT(*) as mapping_count
FROM ghl_role_mappings
GROUP BY tenant_id;

-- 3. Check Workflow Settings
SELECT 
    id,
    name,
    trigger_type,
    action_type,
    is_active,
    tenant_id,
    created_at
FROM workflow_settings
ORDER BY tenant_id, name;

-- 4. Count Workflow Settings per tenant
SELECT 
    tenant_id,
    COUNT(*) as workflow_count
FROM workflow_settings
GROUP BY tenant_id;
