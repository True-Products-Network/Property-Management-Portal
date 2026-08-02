-- Business isolation support
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

-- Add business_id to existing tables
ALTER TABLE associations ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE units ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
-- Note: compliance_items table may not exist yet, skip if it doesn't
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliance_items') THEN
        ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
    END IF;
END $$;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE communications ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);

-- Create indexes for business lookups
CREATE INDEX IF NOT EXISTS idx_associations_business ON associations(business_id);
CREATE INDEX IF NOT EXISTS idx_contacts_business ON contacts(business_id);
CREATE INDEX IF NOT EXISTS idx_properties_business ON properties(business_id);
CREATE INDEX IF NOT EXISTS idx_units_business ON units(business_id);
CREATE INDEX IF NOT EXISTS idx_vendors_business ON vendors(business_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_business ON maintenance_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_inspections_business ON inspections(business_id);
CREATE INDEX IF NOT EXISTS idx_documents_business ON documents(business_id);
-- Note: compliance_items index only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliance_items') THEN
        CREATE INDEX IF NOT EXISTS idx_compliance_business ON compliance_items(business_id);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_approvals_business ON approvals(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_communications_business ON communications(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id);
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
CREATE POLICY business_users_select ON business_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY business_users_insert ON business_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY business_users_delete ON business_users
    FOR DELETE USING (user_id = auth.uid());

-- Associations: Filter by business
CREATE POLICY associations_business_isolation ON associations
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Contacts: Filter by business
CREATE POLICY contacts_business_isolation ON contacts
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Properties: Filter by business
CREATE POLICY properties_business_isolation ON properties
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Units: Filter by business
CREATE POLICY units_business_isolation ON units
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Vendors: Filter by business
CREATE POLICY vendors_business_isolation ON vendors
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Maintenance: Filter by business
CREATE POLICY maintenance_business_isolation ON maintenance_requests
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Inspections: Filter by business
CREATE POLICY inspections_business_isolation ON inspections
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Documents: Filter by business
CREATE POLICY documents_business_isolation ON documents
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Compliance: Filter by business (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliance_items') THEN
        CREATE POLICY compliance_business_isolation ON compliance_items
            FOR ALL USING (
                business_id = get_current_business_id() 
                OR is_admin_from_jwt()
            );
    END IF;
END $$;

-- Approvals: Filter by business
CREATE POLICY approvals_business_isolation ON approvals
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Payments: Filter by business
CREATE POLICY payments_business_isolation ON payments
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Communications: Filter by business
CREATE POLICY communications_business_isolation ON communications
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Appointments: Filter by business
CREATE POLICY appointments_business_isolation ON appointments
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );

-- Feature flags: Can be global (null business) or business-specific
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
        -- Update compliance_items only if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliance_items') THEN
            UPDATE compliance_items SET business_id = default_business_id WHERE business_id IS NULL;
        END IF;
        UPDATE approvals SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE payments SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE communications SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE appointments SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE workflows SET business_id = default_business_id WHERE business_id IS NULL;
        UPDATE workflow_executions SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
END $$;
