-- Check all contact roles and their tenant_ids
SELECT 
    id,
    record_type,
    field_name,
    value,
    label,
    sort_order,
    tenant_id,
    is_active,
    created_at
FROM dropdown_settings 
WHERE record_type = 'contact' 
AND field_name = 'role'
ORDER BY sort_order, created_at;
