-- Check the vendors_created_by_fkey constraint details
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'vendors'::regclass
  AND conname LIKE '%created_by%';

-- Check all tables named 'vendors' across all schemas
SELECT 
    schemaname,
    tablename
FROM pg_tables
WHERE tablename = 'vendors';

-- Check if there's a vendors table in public schema with different structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vendors'
  AND table_schema = 'public'
ORDER BY ordinal_position;
