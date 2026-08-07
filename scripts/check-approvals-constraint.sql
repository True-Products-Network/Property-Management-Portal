-- Check the actual foreign key constraint on approvals table

-- Get the constraint definition
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'approvals';

-- Check if the portal user actually exists
SELECT * FROM portal_users WHERE id = '97cbd505-95e3-472f-b924-75d309c29a09';

-- Check if there's a row in auth.users (for comparison)
SELECT id, email FROM auth.users WHERE id = '97cbd505-95e3-472f-b924-75d309c29a09';
