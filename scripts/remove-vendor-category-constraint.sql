-- Remove the vendors category check constraint
-- This allows any category value from dropdown settings

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_category_check;

-- Verify constraint was removed
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'vendors'::regclass
AND conname LIKE '%category%';
