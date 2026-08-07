-- Cleanup dropdown_settings data
-- 1. Remove old People -> Contact Role(s) entries (keeping contact -> role)
-- 2. Consolidate Unit/unit record types
-- 3. Check what uses the old data before deleting

-- First, let's see what's using the old People/Contact Role(s) data
SELECT 
    'People Contact Role(s) count' as check_type,
    COUNT(*) as count
FROM dropdown_settings 
WHERE record_type = 'People' AND field_name = 'Contact Role(s)'
UNION ALL
SELECT 
    'contact role count' as check_type,
    COUNT(*) as count
FROM dropdown_settings 
WHERE record_type = 'contact' AND field_name = 'role';

-- Check if any contacts reference the old People/Contact Role(s) values
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.role,
    ds.value as matched_value,
    ds.label as matched_label
FROM contacts c
LEFT JOIN dropdown_settings ds ON ds.value = c.role 
    AND ds.record_type = 'People' 
    AND ds.field_name = 'Contact Role(s)'
WHERE ds.id IS NOT NULL;

-- Check unit/Unit duplication
SELECT 
    record_type,
    field_name,
    COUNT(*) as value_count
FROM dropdown_settings 
WHERE LOWER(record_type) = 'unit'
GROUP BY record_type, field_name
ORDER BY record_type, field_name;
