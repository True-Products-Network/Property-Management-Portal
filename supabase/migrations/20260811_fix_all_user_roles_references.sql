-- Fix all references to user_roles.role column
-- The user_roles table now uses role_id (UUID) referencing roles.id

-- Drop and recreate is_admin_user function (no revoked_at in user_roles)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name = 'Admin User'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate is_management_staff function if it exists (no revoked_at)
DROP FUNCTION IF EXISTS is_management_staff();
CREATE OR REPLACE FUNCTION is_management_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name IN ('Admin User', 'Management Staff', 'Property Manager', 'Association Manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any RLS policies that reference user_roles.role
-- These need to be updated to use the new schema

-- Update associations policies if they exist
DROP POLICY IF EXISTS associations_admin_all ON associations;
DROP POLICY IF EXISTS associations_management_all ON associations;
DROP POLICY IF EXISTS associations_user_select ON associations;

-- Recreate with correct schema
CREATE POLICY associations_tenant_isolation ON associations
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update contacts policies
DROP POLICY IF EXISTS contacts_admin_all ON contacts;
DROP POLICY IF EXISTS contacts_management_all ON contacts;
DROP POLICY IF EXISTS contacts_user_select ON contacts;

CREATE POLICY contacts_tenant_isolation ON contacts
    FOR ALL USING (
        tenant_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update properties policies  
DROP POLICY IF EXISTS properties_admin_all ON properties;
DROP POLICY IF EXISTS properties_management_all ON properties;
DROP POLICY IF EXISTS properties_user_select ON properties;

CREATE POLICY properties_tenant_isolation ON properties
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update units policies
DROP POLICY IF EXISTS units_admin_all ON units;
DROP POLICY IF EXISTS units_management_all ON units;
DROP POLICY IF EXISTS units_user_select ON units;

CREATE POLICY units_tenant_isolation ON units
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update maintenance_requests policies
DROP POLICY IF EXISTS maintenance_admin_all ON maintenance_requests;
DROP POLICY IF EXISTS maintenance_management_all ON maintenance_requests;
DROP POLICY IF EXISTS maintenance_user_select ON maintenance_requests;

CREATE POLICY maintenance_tenant_isolation ON maintenance_requests
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update vendors policies
DROP POLICY IF EXISTS vendors_admin_all ON vendors;
DROP POLICY IF EXISTS vendors_management_all ON vendors;
DROP POLICY IF EXISTS vendors_user_select ON vendors;

CREATE POLICY vendors_tenant_isolation ON vendors
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update inspections policies
DROP POLICY IF EXISTS inspections_admin_all ON inspections;
DROP POLICY IF EXISTS inspections_management_all ON inspections;
DROP POLICY IF EXISTS inspections_user_select ON inspections;

CREATE POLICY inspections_tenant_isolation ON inspections
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update documents policies
DROP POLICY IF EXISTS documents_admin_all ON documents;
DROP POLICY IF EXISTS documents_management_all ON documents;
DROP POLICY IF EXISTS documents_user_select ON documents;

CREATE POLICY documents_tenant_isolation ON documents
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update approvals policies
DROP POLICY IF EXISTS approvals_admin_all ON approvals;
DROP POLICY IF EXISTS approvals_management_all ON approvals;
DROP POLICY IF EXISTS approvals_user_select ON approvals;

CREATE POLICY approvals_tenant_isolation ON approvals
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update compliance_matters policies
DROP POLICY IF EXISTS compliance_admin_all ON compliance_matters;
DROP POLICY IF EXISTS compliance_management_all ON compliance_matters;
DROP POLICY IF EXISTS compliance_user_select ON compliance_matters;

CREATE POLICY compliance_tenant_isolation ON compliance_matters
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update payment_records policies
DROP POLICY IF EXISTS payments_admin_all ON payment_records;
DROP POLICY IF EXISTS payments_management_all ON payment_records;
DROP POLICY IF EXISTS payments_user_select ON payment_records;

CREATE POLICY payments_tenant_isolation ON payment_records
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );

-- Update communications policies
DROP POLICY IF EXISTS communications_admin_all ON communications;
DROP POLICY IF EXISTS communications_management_all ON communications;
DROP POLICY IF EXISTS communications_user_select ON communications;

CREATE POLICY communications_tenant_isolation ON communications
    FOR ALL USING (
        business_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'Admin User'
            
        )
    );
