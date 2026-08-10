-- Add tenant_id to all business-level entities for easier filtering
-- Business-level entities: associations, properties, units, vendors, maintenance, inspections, documents, approvals, compliance, payments, communications

-- Function to safely add tenant_id column if table exists
CREATE OR REPLACE FUNCTION add_tenant_id_if_table_exists(p_table_name TEXT)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = p_table_name) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)', p_table_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add tenant_id to business-level entities
SELECT add_tenant_id_if_table_exists('associations');
SELECT add_tenant_id_if_table_exists('properties');
SELECT add_tenant_id_if_table_exists('units');
SELECT add_tenant_id_if_table_exists('vendors');
SELECT add_tenant_id_if_table_exists('maintenance_requests');
SELECT add_tenant_id_if_table_exists('inspections');
SELECT add_tenant_id_if_table_exists('documents');
SELECT add_tenant_id_if_table_exists('approvals');
SELECT add_tenant_id_if_table_exists('compliance_matters');
SELECT add_tenant_id_if_table_exists('payment_records');
SELECT add_tenant_id_if_table_exists('communications');

-- Drop the helper function
DROP FUNCTION IF EXISTS add_tenant_id_if_table_exists(TEXT);

-- Create indexes for tenant lookups
CREATE INDEX IF NOT EXISTS idx_associations_tenant ON associations(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_units_tenant ON units(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON vendors(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_requests(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inspections_tenant ON inspections(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_approvals_tenant ON approvals(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_tenant ON compliance_matters(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payment_records(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_communications_tenant ON communications(tenant_id) WHERE tenant_id IS NOT NULL;

-- Update RLS policies to include tenant_id checks
-- This allows filtering by either business_id OR tenant_id

-- Associations: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS associations_business_isolation ON associations;
CREATE POLICY associations_tenant_isolation ON associations
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );

-- Properties: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS properties_business_isolation ON properties;
CREATE POLICY properties_tenant_isolation ON properties
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );

-- Vendors: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS vendors_business_isolation ON vendors;
CREATE POLICY vendors_tenant_isolation ON vendors
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );

-- Units: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS units_business_isolation ON units;
CREATE POLICY units_tenant_isolation ON units
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );

-- Maintenance: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS maintenance_business_isolation ON maintenance_requests;
CREATE POLICY maintenance_tenant_isolation ON maintenance_requests
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );

-- Inspections: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS inspections_business_isolation ON inspections;
CREATE POLICY inspections_tenant_isolation ON inspections
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );

-- Documents: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS documents_business_isolation ON documents;
CREATE POLICY documents_tenant_isolation ON documents
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );

-- Approvals: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS approvals_business_isolation ON approvals;
CREATE POLICY approvals_tenant_isolation ON approvals
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );

-- Compliance: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS compliance_business_isolation ON compliance_matters;
CREATE POLICY compliance_tenant_isolation ON compliance_matters
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );

-- Payments: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS payments_business_isolation ON payment_records;
CREATE POLICY payments_tenant_isolation ON payment_records
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );

-- Communications: Filter by business_id OR tenant_id
DROP POLICY IF EXISTS communications_business_isolation ON communications;
CREATE POLICY communications_tenant_isolation ON communications
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
        OR is_admin_from_jwt()
    );
