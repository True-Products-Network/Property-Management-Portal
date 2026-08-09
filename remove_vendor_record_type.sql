-- Remove 'Vendor' record type entries from dropdown_settings
-- Since we're now using 'Vendor Company' instead

-- Delete all dropdown values with record_type = 'Vendor'
DELETE FROM dropdown_settings 
WHERE record_type = 'Vendor';

-- Verify removal - should only show 'Vendor Company' now
SELECT DISTINCT record_type, field_name 
FROM dropdown_settings 
WHERE record_type LIKE '%Vendor%'
ORDER BY record_type, field_name;
