-- Check ALL foreign key constraints on vendors table
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'vendors'::regclass
  AND contype = 'f';

-- Check if business_id or tenant_id FKs exist
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'vendors'::regclass;
