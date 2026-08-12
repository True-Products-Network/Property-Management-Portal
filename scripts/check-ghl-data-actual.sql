-- Check actual GHL data

-- 1. Check GHL Role Mappings
SELECT 
    id,
    ghl_contact_role,
    portal_role,
    portal_version,
    status,
    user_count,
    created_at
FROM ghl_role_mappings
ORDER BY portal_role;

-- 2. Count GHL Role Mappings
SELECT COUNT(*) as total_mappings FROM ghl_role_mappings;

-- 3. Check Workflows
SELECT 
    id,
    code,
    ghl_workflow_name,
    trigger,
    active,
    business_id,
    run_count,
    created_at
FROM workflows
ORDER BY code;

-- 4. Count Workflows
SELECT COUNT(*) as total_workflows FROM workflows;

-- 5. Check workflows by business_id
SELECT 
    business_id,
    COUNT(*) as workflow_count
FROM workflows
GROUP BY business_id;
