-- Check if all required tables and columns exist
DO $$
BEGIN
    -- Check user_roles table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_roles' AND column_name = 'tenant_id' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'user_roles table is missing tenant_id column';
    END IF;
    
    -- Check tenant_users table (referenced in policies)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenant_users' AND column_name = 'tenant_id' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'tenant_users table is missing tenant_id column';
    END IF;
END $$;

-- Show all tables that reference tenant_id
SELECT 
    table_name, 
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name = 'tenant_id' 
AND table_schema = 'public'
ORDER BY table_name;
