-- Cleanup duplicate vendor dropdowns
-- Run this in Supabase SQL Editor

-- 1. Remove "Vendor Company" collection and all its dropdowns
DELETE FROM dropdown_values 
WHERE dropdown_id IN (
  SELECT id FROM dropdowns 
  WHERE record_type = 'Vendor Company'
);

DELETE FROM dropdowns 
WHERE record_type = 'Vendor Company';

-- 2. Remove "Category" dropdown from Vendor collection
DELETE FROM dropdown_values 
WHERE dropdown_id IN (
  SELECT id FROM dropdowns 
  WHERE record_type = 'Vendor' AND field_name = 'Category'
);

DELETE FROM dropdowns 
WHERE record_type = 'Vendor' AND field_name = 'Category';

-- 3. Remove "Status" dropdown from Vendor collection
DELETE FROM dropdown_values 
WHERE dropdown_id IN (
  SELECT id FROM dropdowns 
  WHERE record_type = 'Vendor' AND field_name = 'Status'
);

DELETE FROM dropdowns 
WHERE record_type = 'Vendor' AND field_name = 'Status';

-- 4. Rename 'type' to 'Vendor Type' if it exists
UPDATE dropdowns 
SET field_name = 'Vendor Type', label = 'Vendor Type'
WHERE record_type = 'Vendor' AND field_name = 'type';

-- 5. Verify remaining Vendor dropdowns
SELECT record_type, field_name, label, is_active 
FROM dropdowns 
WHERE record_type = 'Vendor' 
ORDER BY field_name;
