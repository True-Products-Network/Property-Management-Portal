-- Remove status check constraints from units and vendors
-- This allows any status value from dropdown settings

-- Remove units status constraint
ALTER TABLE units DROP CONSTRAINT IF EXISTS units_status_check;

-- Remove vendors status constraint
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_status_check;

-- Verify constraints were removed
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'units'::regclass AND conname LIKE '%status%'
UNION ALL
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'vendors'::regclass AND conname LIKE '%status%';
