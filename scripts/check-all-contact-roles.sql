-- Check ALL contact roles including old ones
SELECT 
    id,
    value,
    label,
    sort_order,
    tenant_id,
    is_active,
    created_at
FROM dropdown_settings 
WHERE record_type = 'contact' 
ORDER BY field_name, value, created_at;
