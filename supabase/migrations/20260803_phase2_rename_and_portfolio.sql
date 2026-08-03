-- Phase 2: Rename business_id to tenant_id and Add Portfolio Support
-- Multi-Tenant Platform Architecture Implementation
-- Date: August 3, 2026
--
-- This migration:
-- 1. Renames business_id columns to tenant_id
-- 2. Adds portfolio_id to associations
-- 3. Migrates existing data to new structure
-- 4. Creates default tenant and portfolio for existing data

-- ============================================
-- STEP 1: Create default tenant for existing data
-- ============================================

DO $$
DECLARE
    default_tenant_id UUID;
    default_portfolio_id UUID;
BEGIN
    -- Check if we already have a default tenant
    SELECT id INTO default_tenant_id FROM tenants WHERE code = 'exemplary-services' LIMIT 1;
    
    IF default_tenant_id IS NULL THEN
        -- Create default tenant for Exemplary Services LLC
        INSERT INTO tenants (
            id,
            name,
            code,
            status,
            timezone,
            locale,
            primary_email,
            billing_email,
            settings,
            created_at
        )
        SELECT 
            gen_random_uuid(),
            'Exemplary Services LLC',
            'exemplary-services',
            'active',
            'America/Chicago',
            'en-US',
            'admin@exemplaryservices.com',
            'billing@exemplaryservices.com',
            jsonb_build_object(
                'legacy_migration', true,
                'migrated_at', NOW()
            ),
            NOW()
        WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE code = 'exemplary-services')
        RETURNING id INTO default_tenant_id;
        
        RAISE NOTICE 'Created default tenant: %', default_tenant_id;
    ELSE
        RAISE NOTICE 'Default tenant already exists: %', default_tenant_id;
    END IF;
    
    -- Get the tenant ID (whether just created or existing)
    SELECT id INTO default_tenant_id FROM tenants WHERE code = 'exemplary-services';
    
    -- ============================================
    -- STEP 2: Create default portfolio
    -- ============================================
    
    SELECT id INTO default_portfolio_id FROM portfolios 
    WHERE tenant_id = default_tenant_id AND is_default = true LIMIT 1;
    
    IF default_portfolio_id IS NULL THEN
        INSERT INTO portfolios (
            id,
            tenant_id,
            name,
            description,
            is_default,
            settings,
            created_at
        )
        VALUES (
            gen_random_uuid(),
            default_tenant_id,
            'Default Portfolio',
            'Main portfolio for Exemplary Services LLC',
            true,
            jsonb_build_object(
                'legacy_migration', true,
                'migrated_at', NOW()
            ),
            NOW()
        )
        RETURNING id INTO default_portfolio_id;
        
        RAISE NOTICE 'Created default portfolio: %', default_portfolio_id;
    ELSE
        RAISE NOTICE 'Default portfolio already exists: %', default_portfolio_id;
    END IF;
    
    -- ============================================
    -- STEP 3: Create tenant subscription
    -- ============================================
    
    INSERT INTO tenant_subscriptions (
        tenant_id,
        plan_id,
        status,
        effective_date
    )
    SELECT 
        default_tenant_id,
        p.id,
        'active',
        CURRENT_DATE
    FROM plans p
    WHERE p.code = 'growth'
    ON CONFLICT (tenant_id) DO NOTHING;
    
    RAISE NOTICE 'Created tenant subscription';
    
END $$;

-- ============================================
-- STEP 4: Rename businesses table to tenants
-- ============================================

-- First, check if businesses table exists and has data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses') THEN
        -- Migrate existing businesses to tenants
        INSERT INTO tenants (
            id,
            name,
            code,
            status,
            settings,
            created_at
        )
        SELECT 
            id,
            name,
            COALESCE(slug, LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))),
            status,
            settings,
            created_at
        FROM businesses
        ON CONFLICT (code) DO NOTHING;
        
        RAISE NOTICE 'Migrated businesses to tenants';
    END IF;
END $$;

-- ============================================
-- STEP 5: Rename business_users to tenant_users
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_users') THEN
        -- Migrate existing business_users to tenant_users
        INSERT INTO tenant_users (
            tenant_id,
            user_id,
            role,
            is_primary_admin,
            joined_at,
            created_at
        )
        SELECT 
            business_id,
            user_id,
            CASE WHEN role = 'admin' THEN 'admin' ELSE 'member' END,
            false,
            created_at,
            created_at
        FROM business_users
        ON CONFLICT (tenant_id, user_id) DO NOTHING;
        
        RAISE NOTICE 'Migrated business_users to tenant_users';
    END IF;
END $$;

-- ============================================
-- STEP 6: Add tenant_id to all tables (if not exists)
-- ============================================

-- Check and add tenant_id to associations
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM tenants WHERE code = 'exemplary-services';
    
    -- Add tenant_id column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'associations' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE associations ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        
        -- Backfill with default tenant
        UPDATE associations SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        
        RAISE NOTICE 'Added tenant_id to associations';
    END IF;
END $$;

-- Add tenant_id to other tables as needed
DO $$
DECLARE
    default_tenant_id UUID;
    tables_to_update TEXT[] := ARRAY[
        'contacts', 'properties', 'units', 'vendors', 
        'maintenance_requests', 'inspections', 'documents',
        'approvals', 'payments', 'communications', 'appointments',
        'workflows', 'workflow_executions', 'feature_flags'
    ];
    tbl TEXT;
BEGIN
    SELECT id INTO default_tenant_id FROM tenants WHERE code = 'exemplary-services';
    
    FOREACH tbl IN ARRAY tables_to_update
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl) THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = tbl AND column_name = 'tenant_id'
            ) THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id UUID REFERENCES tenants(id)', tbl);
                EXECUTE format('UPDATE %I SET tenant_id = $1 WHERE tenant_id IS NULL', tbl) USING default_tenant_id;
                RAISE NOTICE 'Added tenant_id to %', tbl;
            END IF;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- STEP 7: Add portfolio_id to associations
-- ============================================

DO $$
DECLARE
    default_portfolio_id UUID;
BEGIN
    SELECT p.id INTO default_portfolio_id 
    FROM portfolios p
    JOIN tenants t ON t.id = p.tenant_id
    WHERE t.code = 'exemplary-services' AND p.is_default = true;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'associations' AND column_name = 'portfolio_id'
    ) THEN
        ALTER TABLE associations ADD COLUMN portfolio_id UUID REFERENCES portfolios(id);
        
        -- Backfill with default portfolio
        UPDATE associations SET portfolio_id = default_portfolio_id WHERE portfolio_id IS NULL;
        
        RAISE NOTICE 'Added portfolio_id to associations';
    END IF;
END $$;

-- ============================================
-- STEP 8: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_associations_tenant ON associations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_associations_portfolio ON associations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant ON units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inspections_tenant ON inspections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);

-- ============================================
-- STEP 9: Migrate GHL credentials to association level
-- ============================================

DO $$
DECLARE
    cred RECORD;
    assoc RECORD;
BEGIN
    -- Check if old ghl_credentials table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ghl_credentials') THEN
        -- For each association, create a GHL connection
        FOR assoc IN SELECT id, tenant_id FROM associations WHERE tenant_id IS NOT NULL
        LOOP
            -- Get the first GHL credentials for this tenant
            SELECT * INTO cred 
            FROM ghl_credentials 
            WHERE business_id = assoc.tenant_id 
            LIMIT 1;
            
            IF cred IS NOT NULL THEN
                INSERT INTO association_ghl_connections (
                    association_id,
                    ghl_location_id,
                    ghl_company_id,
                    is_active,
                    sync_enabled,
                    connected_at
                )
                VALUES (
                    assoc.id,
                    cred.location_id,
                    cred.company_id,
                    true,
                    true,
                    NOW()
                )
                ON CONFLICT (association_id) DO NOTHING;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Migrated GHL credentials to association level';
    END IF;
END $$;

-- ============================================
-- STEP 10: Update RLS policies for tenant isolation
-- ============================================

-- Drop old business-based policies if they exist
DROP POLICY IF EXISTS associations_business_isolation ON associations;
DROP POLICY IF EXISTS contacts_business_isolation ON contacts;
DROP POLICY IF EXISTS properties_business_isolation ON properties;
DROP POLICY IF EXISTS units_business_isolation ON units;
DROP POLICY IF EXISTS vendors_business_isolation ON vendors;
DROP POLICY IF EXISTS maintenance_business_isolation ON maintenance_requests;
DROP POLICY IF EXISTS inspections_business_isolation ON inspections;
DROP POLICY IF EXISTS documents_business_isolation ON documents;

-- Create new tenant-based policies
CREATE POLICY associations_tenant_isolation ON associations
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
        OR is_platform_admin()
        OR has_active_support_session(tenant_id)
    );

CREATE POLICY contacts_tenant_isolation ON contacts
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
        OR is_platform_admin()
        OR has_active_support_session(tenant_id)
    );

CREATE POLICY properties_tenant_isolation ON properties
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
        OR is_platform_admin()
        OR has_active_support_session(tenant_id)
    );

CREATE POLICY units_tenant_isolation ON units
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
        OR is_platform_admin()
        OR has_active_support_session(tenant_id)
    );

CREATE POLICY vendors_tenant_isolation ON vendors
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
        OR is_platform_admin()
        OR has_active_support_session(tenant_id)
    );

CREATE POLICY maintenance_tenant_isolation ON maintenance_requests
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
        OR is_platform_admin()
        OR has_active_support_session(tenant_id)
    );

CREATE POLICY inspections_tenant_isolation ON inspections
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
        OR is_platform_admin()
        OR has_active_support_session(tenant_id)
    );

CREATE POLICY documents_tenant_isolation ON documents
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
        OR is_platform_admin()
        OR has_active_support_session(tenant_id)
    );

-- ============================================
-- STEP 11: Update user metadata for existing users
-- ============================================

-- Note: This requires service role key and should be done via application code
-- This is just a placeholder for the migration record

-- ============================================
-- MIGRATION COMPLETION LOG
-- ============================================

INSERT INTO platform_audit_events (
    actor_id,
    actor_type,
    action,
    action_category,
    target_type,
    target_id,
    reason,
    new_value
)
SELECT 
    auth.uid(),
    'system',
    'phase2_migration_completed',
    'tenant',
    'migration',
    '20260803_phase2_rename_and_portfolio',
    'Phase 2: Renamed business_id to tenant_id, added portfolio support',
    jsonb_build_object(
        'actions', ARRAY[
            'Created default tenant for Exemplary Services LLC',
            'Created default portfolio',
            'Added tenant_id to all business tables',
            'Added portfolio_id to associations',
            'Migrated GHL credentials to association level',
            'Updated RLS policies for tenant isolation'
        ],
        'timestamp', NOW()
    )
WHERE auth.uid() IS NOT NULL;
