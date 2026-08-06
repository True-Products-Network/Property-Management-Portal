-- Check units table constraints
-- Run this in Supabase SQL Editor

-- 1. Check the occupancy_status check constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'units'::regclass
AND conname LIKE '%occupancy%';

-- 2. Check all check constraints on units table
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'units'::regclass
AND contype = 'c';

-- 3. Check column definitions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'units'
AND column_name IN ('occupancy_status', 'rental_status', 'status');
