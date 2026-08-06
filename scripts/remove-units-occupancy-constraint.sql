-- Remove the occupancy_status check constraint from units table
-- This allows any value from dropdown settings
-- The code will count values containing "vacant" as vacant and "occupied" as occupied

ALTER TABLE units DROP CONSTRAINT IF EXISTS units_occupancy_status_check;

-- Also check for rental_status constraint and remove if exists
ALTER TABLE units DROP CONSTRAINT IF EXISTS units_rental_status_check;

-- Verify constraints were removed
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'units'::regclass
AND conname LIKE '%status%';
