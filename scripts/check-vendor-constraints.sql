-- Check vendors table constraints
-- Run this in Supabase SQL Editor

-- 1. Check all FK constraints on vendors
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'vendors'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Check all check constraints on vendors
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'vendors'::regclass
AND contype = 'c';

-- 3. Check column definitions for status/category fields
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vendors';
