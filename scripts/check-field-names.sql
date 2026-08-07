-- Check actual field names in dropdown_settings
SELECT DISTINCT 
    record_type,
    field_name,
    COUNT(*) as value_count
FROM dropdown_settings 
WHERE record_type = 'contact'
GROUP BY record_type, field_name
ORDER BY record_type, field_name;
