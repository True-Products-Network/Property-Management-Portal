-- Multi-tenancy support
-- Adds tenant_id to all tables for data isolation between businesses

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Create tenant_users junction table
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Enable RLS on tenant_users
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Add tenant_id to existing tables
ALTER TABLE associations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE units ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE communications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Create indexes for tenant lookups
CREATE INDEX IF NOT EXISTS idx_associations_tenant ON associations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant ON units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inspections_tenant ON inspections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tenant ON compliance_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approvals_tenant ON approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communications_tenant ON communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);

-- Function to get current user's tenant
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
    -- Get tenant from JWT claims
    tenant_id := (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID;
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for tenant isolation

-- Tenants: Users can only see their own tenants
CREATE POLICY tenant_users_select ON tenant_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY tenant_users_insert ON tenant_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY tenant_users_delete ON tenant_users
    FOR DELETE USING (user_id = auth.uid());

-- Associations: Filter by tenant
CREATE POLICY associations_tenant_isolation ON associations
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Contacts: Filter by tenant
CREATE POLICY contacts_tenant_isolation ON contacts
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Properties: Filter by tenant
CREATE POLICY properties_tenant_isolation ON properties
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Units: Filter by tenant
CREATE POLICY units_tenant_isolation ON units
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Vendors: Filter by tenant
CREATE POLICY vendors_tenant_isolation ON vendors
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Maintenance: Filter by tenant
CREATE POLICY maintenance_tenant_isolation ON maintenance_requests
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Inspections: Filter by tenant
CREATE POLICY inspections_tenant_isolation ON inspections
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Documents: Filter by tenant
CREATE POLICY documents_tenant_isolation ON documents
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Compliance: Filter by tenant
CREATE POLICY compliance_tenant_isolation ON compliance_items
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Approvals: Filter by tenant
CREATE POLICY approvals_tenant_isolation ON approvals
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Payments: Filter by tenant
CREATE POLICY payments_tenant_isolation ON payments
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Communications: Filter by tenant
CREATE POLICY communications_tenant_isolation ON communications
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Appointments: Filter by tenant
CREATE POLICY appointments_tenant_isolation ON appointments
    FOR ALL USING (
        tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Feature flags: Can be global (null tenant) or tenant-specific
CREATE POLICY feature_flags_tenant_isolation ON feature_flags
    FOR ALL USING (
        tenant_id IS NULL 
        OR tenant_id = get_current_tenant_id() 
        OR is_admin_from_jwt()
    );

-- Insert default tenant for existing data
INSERT INTO tenants (id, name, slug, status)
SELECT gen_random_uuid(), 'Default Organization', 'default', 'active'
WHERE NOT EXISTS (SELECT 1 FROM tenants LIMIT 1);

-- Update existing records to use default tenant
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM tenants WHERE slug = 'default' LIMIT 1;
    
    IF default_tenant_id IS NOT NULL THEN
        UPDATE associations SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE contacts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE properties SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE units SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE vendors SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE maintenance_requests SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE inspections SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE documents SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE compliance_items SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE approvals SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE payments SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE communications SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE appointments SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE workflows SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE workflow_executions SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;
END $$;
