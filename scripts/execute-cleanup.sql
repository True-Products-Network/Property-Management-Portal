-- Execute cleanup of dropdown_settings
-- WARNING: Run the check script first to verify no data will break

-- 1. Remove old People -> Contact Role(s) entries
-- These are superseded by contact -> role
DELETE FROM dropdown_settings 
WHERE record_type = 'People' 
AND field_name = 'Contact Role(s)';

-- 2. Consolidate unit -> Unit (standardize on capitalized version)
-- First, update any references from 'unit' to 'Unit' in other tables if needed
-- Then delete the lowercase 'unit' entries
DELETE FROM dropdown_settings 
WHERE record_type = 'unit';

-- 3. Standardize record_type capitalization
-- Update all record_types to be properly capitalized
UPDATE dropdown_settings 
SET record_type = INITCAP(record_type)
WHERE record_type != INITCAP(record_type);

-- Verify cleanup
SELECT 
    record_type,
    field_name,
    COUNT(*) as value_count
FROM dropdown_settings 
GROUP BY record_type, field_name
ORDER BY record_type, field_name;
