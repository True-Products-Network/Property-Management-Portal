-- Fix RLS Recursion Issues - Version 2
-- Date: August 1, 2026
-- Problem: RLS policies on tables querying user_roles cause infinite recursion
-- Solution: Use SECURITY DEFINER functions that bypass RLS

-- First, drop all policies that depend on the functions (in correct order)
-- CONTACTS
DROP POLICY IF EXISTS "Users can view contacts in their associations" ON contacts;
DROP POLICY IF EXISTS "Management can manage contacts" ON contacts;

-- VENDORS
DROP POLICY IF EXISTS "Users can view vendors" ON vendors;
DROP POLICY IF EXISTS "Management can manage vendors" ON vendors;

-- DOCUMENTS
DROP POLICY IF EXISTS "Users can view documents in their associations" ON documents;
DROP POLICY IF EXISTS "Management can manage documents" ON documents;

-- COMPLIANCE
DROP POLICY IF EXISTS "Users can view compliance in their associations" ON compliance_matters;
DROP POLICY IF EXISTS "Management can manage compliance" ON compliance_matters;

-- APPROVALS
DROP POLICY IF EXISTS "Users can view approvals in their associations" ON approval_requests;
DROP POLICY IF EXISTS "Management can manage approvals" ON approval_requests;

-- COMMUNICATIONS
DROP POLICY IF EXISTS "Users can view communications in their associations" ON communications;
DROP POLICY IF EXISTS "Management can manage communications" ON communications;

-- PAYMENTS
DROP POLICY IF EXISTS "Users can view payments in their associations" ON payment_records;
DROP POLICY IF EXISTS "Management can manage payments" ON payment_records;

-- APPOINTMENTS
DROP POLICY IF EXISTS "Users can view appointments in their associations" ON appointments;
DROP POLICY IF EXISTS "Management can manage appointments" ON appointments;

-- ASSOCIATIONS
DROP POLICY IF EXISTS "Users can view their associations" ON associations;
DROP POLICY IF EXISTS "Management can manage associations" ON associations;

-- PROPERTIES
DROP POLICY IF EXISTS "Users can view properties in their associations" ON properties;
DROP POLICY IF EXISTS "Management can manage properties" ON properties;

-- UNITS
DROP POLICY IF EXISTS "Users can view units in their associations" ON units;
DROP POLICY IF EXISTS "Management can manage units" ON units;

-- MAINTENANCE REQUESTS
DROP POLICY IF EXISTS "Users can view maintenance in their associations" ON maintenance_requests;
DROP POLICY IF EXISTS "Management can manage maintenance" ON maintenance_requests;

-- INSPECTIONS
DROP POLICY IF EXISTS "Users can view inspections in their associations" ON inspections;
DROP POLICY IF EXISTS "Management can manage inspections" ON inspections;

-- Now drop the functions (they have no more dependents)
DROP FUNCTION IF EXISTS is_admin_user(UUID);
DROP FUNCTION IF EXISTS get_user_association_ids(UUID);
DROP FUNCTION IF EXISTS is_management_staff(UUID);

-- Recreate helper functions with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = $1 
        AND user_roles.role = 'ADMIN_USER'
        AND user_roles.revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_management_staff(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = $1 
        AND user_roles.role IN ('ADMIN_USER', 'MANAGEMENT_STAFF')
        AND user_roles.revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_association_ids(user_id UUID)
RETURNS TABLE(association_id TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ur.association_id::TEXT
    FROM user_roles ur
    WHERE ur.user_id = $1
    AND ur.association_id IS NOT NULL
    AND ur.revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new non-recursive policies

-- ASSOCIATIONS
CREATE POLICY "Users can view their associations" ON associations
    FOR SELECT USING (
        id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage associations" ON associations
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- PROPERTIES
CREATE POLICY "Users can view properties in their associations" ON properties
    FOR SELECT USING (
        association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage properties" ON properties
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- UNITS
CREATE POLICY "Users can view units in their associations" ON units
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        )
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage units" ON units
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- MAINTENANCE REQUESTS
CREATE POLICY "Users can view maintenance in their associations" ON maintenance_requests
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        )
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage maintenance" ON maintenance_requests
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- INSPECTIONS
CREATE POLICY "Users can view inspections in their associations" ON inspections
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        )
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage inspections" ON inspections
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- VENDORS
CREATE POLICY "Users can view vendors" ON vendors
    FOR SELECT USING (true); -- Vendors are viewable by all authenticated users

CREATE POLICY "Management can manage vendors" ON vendors
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- CONTACTS
CREATE POLICY "Users can view contacts in their associations" ON contacts
    FOR SELECT USING (
        is_admin_user(auth.uid()) OR is_management_staff(auth.uid())
    );

CREATE POLICY "Management can manage contacts" ON contacts
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- DOCUMENTS
CREATE POLICY "Users can view documents in their associations" ON documents
    FOR SELECT USING (
        association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage documents" ON documents
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- COMPLIANCE
CREATE POLICY "Users can view compliance in their associations" ON compliance_matters
    FOR SELECT USING (
        association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage compliance" ON compliance_matters
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- APPROVALS
CREATE POLICY "Users can view approvals in their associations" ON approval_requests
    FOR SELECT USING (
        association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage approvals" ON approval_requests
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- COMMUNICATIONS
CREATE POLICY "Users can view communications in their associations" ON communications
    FOR SELECT USING (
        association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage communications" ON communications
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- PAYMENTS
CREATE POLICY "Users can view payments in their associations" ON payment_records
    FOR SELECT USING (
        association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage payments" ON payment_records
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

-- APPOINTMENTS
CREATE POLICY "Users can view appointments in their associations" ON appointments
    FOR SELECT USING (
        association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage appointments" ON appointments
    FOR ALL USING (
        is_management_staff(auth.uid())
    );

SELECT 'RLS policies fixed successfully' as result;
