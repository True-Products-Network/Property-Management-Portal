-- Add tenant_id column to existing roles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE roles ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add other missing columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'is_system_role'
    ) THEN
        ALTER TABLE roles ADD COLUMN is_system_role BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE roles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;
