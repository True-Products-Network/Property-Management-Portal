-- Check the vendors_created_by_fkey constraint details
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'vendors'::regclass
  AND conname LIKE '%created_by%';

-- Check portal_users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'portal_users' 
ORDER BY ordinal_position;

-- Check if the user exists in portal_users
SELECT *
FROM portal_users
WHERE id = '97cbd505-95e3-472f-b924-75d309c29a09';
