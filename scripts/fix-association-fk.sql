-- Fix associations foreign key constraints
-- Run this in Supabase SQL Editor

-- 1. Fix updated_by FK (should reference contacts, not portal_users)
ALTER TABLE associations 
    DROP CONSTRAINT IF EXISTS associations_updated_by_fkey;

ALTER TABLE associations 
    ADD CONSTRAINT associations_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES contacts(id);

-- 2. Also fix created_by if it still has issues
ALTER TABLE associations 
    DROP CONSTRAINT IF EXISTS associations_created_by_fkey;

ALTER TABLE associations 
    ADD CONSTRAINT associations_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES contacts(id);

-- Verify the constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'associations'
    AND tc.constraint_type = 'FOREIGN KEY';
