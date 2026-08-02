-- Business isolation support - Fixed version with correct table names
-- Adds business_id to all tables for data isolation between companies

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create business_users junction table
CREATE TABLE IF NOT EXISTS business_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- Enable RLS on business_users
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- Function to safely add business_id column if table exists
CREATE OR REPLACE FUNCTION add_business_id_if_table_exists(p_table_name TEXT)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = p_table_name) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id)', p_table_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add business_id to existing tables (only if they exist)
-- Core entities
SELECT add_business_id_if_table_exists('associations');
SELECT add_business_id_if_table_exists('contacts');
SELECT add_business_id_if_table_exists('properties');
SELECT add_business_id_if_table_exists('units');
SELECT add_business_id_if_table_exists('vendors');

-- Maintenance
SELECT add_business_id_if_table_exists('maintenance_requests');
SELECT add_business_id_if_table_exists('maintenance_activity');

-- Inspections
SELECT add_business_id_if_table_exists('inspections');

-- Documents
SELECT add_business_id_if_table_exists('documents');
SELECT add_business_id_if_table_exists('document_acknowledgments');

-- Compliance (correct table name is compliance_matters)
SELECT add_business_id_if_table_exists('compliance_matters');

-- Approvals
SELECT add_business_id_if_table_exists('approvals');
SELECT add_business_id_if_table_exists('approval_votes');

-- Payments (correct table name is payment_records)
SELECT add_business_id_if_table_exists('payment_records');
SELECT add_business_id_if_table_exists('association_accounts');

-- Communications
SELECT add_business_id_if_table_exists('communications');
SELECT add_business_id_if_table_exists('communication_recipients');

-- Appointments
SELECT add_business_id_if_table_exists('appointments');
SELECT add_business_id_if_table_exists('appointment_participants');

-- Workflows
SELECT add_business_id_if_table_exists('workflows');
SELECT add_business_id_if_table_exists('workflow_executions');

-- Feature flags
SELECT add_business_id_if_table_exists('feature_flags');

-- Drop the helper function
DROP FUNCTION IF EXISTS add_business_id_if_table_exists(TEXT);

-- Create indexes for business lookups (only if columns were added)
CREATE INDEX IF NOT EXISTS idx_associations_business ON associations(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_business ON contacts(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_business ON properties(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_units_business ON units(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_business ON vendors(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_business ON maintenance_requests(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inspections_business ON inspections(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_business ON documents(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_business ON compliance_matters(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_approvals_business ON approvals(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_business ON payment_records(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_communications_business ON communications(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_business ON business_users(business_id);

-- Function to get current user's business
CREATE OR REPLACE FUNCTION get_current_business_id()
RETURNS UUID AS $$
DECLARE
    business_id UUID;
BEGIN
    -- Get business from JWT claims
    business_id := (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID;
    RETURN business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for business isolation

-- Businesses: Users can only see their own businesses
DROP POLICY IF EXISTS business_users_select ON business_users;
CREATE POLICY business_users_select ON business_users
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS business_users_insert ON business_users;
CREATE POLICY business_users_insert ON business_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS business_users_delete ON business_users;
CREATE POLICY business_users_delete ON business_users
    FOR DELETE USING (user_id = auth.uid());

-- Associations: Filter by business
DROP POLICY IF EXISTS associations_business_isolation ON associations;
CREATE POLICY associations_business_isolation ON associations
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Contacts: Filter by business
DROP POLICY IF EXISTS contacts_business_isolation ON contacts;
CREATE POLICY contacts_business_isolation ON contacts
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Properties: Filter by business
DROP POLICY IF EXISTS properties_business_isolation ON properties;
CREATE POLICY properties_business_isolation ON properties
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Units: Filter by business
DROP POLICY IF EXISTS units_business_isolation ON units;
CREATE POLICY units_business_isolation ON units
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Vendors: Filter by business
DROP POLICY IF EXISTS vendors_business_isolation ON vendors;
CREATE POLICY vendors_business_isolation ON vendors
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Maintenance: Filter by business
DROP POLICY IF EXISTS maintenance_business_isolation ON maintenance_requests;
CREATE POLICY maintenance_business_isolation ON maintenance_requests
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Inspections: Filter by business
DROP POLICY IF EXISTS inspections_business_isolation ON inspections;
CREATE POLICY inspections_business_isolation ON inspections
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Documents: Filter by business
DROP POLICY IF EXISTS documents_business_isolation ON documents;
CREATE POLICY documents_business_isolation ON documents
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Compliance: Filter by business (using correct table name compliance_matters)
DROP POLICY IF EXISTS compliance_business_isolation ON compliance_matters;
CREATE POLICY compliance_business_isolation ON compliance_matters
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Approvals: Filter by business
DROP POLICY IF EXISTS approvals_business_isolation ON approvals;
CREATE POLICY approvals_business_isolation ON approvals
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Payments: Filter by business (using correct table name payment_records)
DROP POLICY IF EXISTS payments_business_isolation ON payment_records;
CREATE POLICY payments_business_isolation ON payment_records
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Communications: Filter by business
DROP POLICY IF EXISTS communications_business_isolation ON communications;
CREATE POLICY communications_business_isolation ON communications
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Appointments: Filter by business
DROP POLICY IF EXISTS appointments_business_isolation ON appointments;
CREATE POLICY appointments_business_isolation ON appointments
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Feature flags: Can be global (null business) or business-specific
DROP POLICY IF EXISTS feature_flags_business_isolation ON feature_flags;
CREATE POLICY feature_flags_business_isolation ON feature_flags
    FOR ALL USING (
        business_id IS NULL 
        OR business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Insert default business for existing data
INSERT INTO businesses (id, name, slug, status)
SELECT gen_random_uuid(), 'Default Business', 'default', 'active'
WHERE NOT EXISTS (SELECT 1 FROM businesses LIMIT 1);

-- Update existing records to use default business
DO $$
DECLARE
    default_business_id UUID;
BEGIN
    SELECT id INTO default_business_id FROM businesses WHERE slug = 'default' LIMIT 1;
    
    IF default_business_id IS NOT NULL THEN
        UPDATE associations SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE contacts SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE properties SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE units SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE vendors SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE maintenance_requests SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE inspections SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE documents SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE compliance_matters SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE approvals SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE payment_records SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE communications SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE appointments SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE workflows SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE workflow_executions SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE feature_flags SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
END $$;
