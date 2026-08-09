-- Remove CHECK constraint from vendors.category to allow dynamic dropdown values
-- The dropdown_settings table now controls valid values

ALTER TABLE vendors 
DROP CONSTRAINT IF EXISTS vendors_category_check;

-- Verify constraint removed
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'vendors'::regclass AND conname LIKE '%category%';
