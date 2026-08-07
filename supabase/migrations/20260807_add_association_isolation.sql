-- Add association_id to isolated entities for multi-association support
-- Shared entities (vendors, portal_users) remain tenant-scoped

-- ============================================
-- CONTACTS (isolated per association)
-- ============================================
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS association_id UUID REFERENCES associations(id);
CREATE INDEX IF NOT EXISTS idx_contacts_association ON contacts(association_id);

-- ============================================
-- PROPERTIES (isolated per association)
-- ============================================
-- Already has association_id, just verify index
CREATE INDEX IF NOT EXISTS idx_properties_association ON properties(association_id);

-- ============================================
-- UNITS (isolated per association via property)
-- Already linked through properties

-- ============================================
-- MAINTENANCE REQUESTS (isolated per association)
-- ============================================
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS association_id UUID REFERENCES associations(id);
CREATE INDEX IF NOT EXISTS idx_maintenance_association ON maintenance_requests(association_id);

-- ============================================
-- COMPLIANCE MATTERS (isolated per association)
-- ============================================
ALTER TABLE compliance_matters ADD COLUMN IF NOT EXISTS association_id UUID REFERENCES associations(id);
CREATE INDEX IF NOT EXISTS idx_compliance_association ON compliance_matters(association_id);

-- ============================================
-- PAYMENTS (isolated per association)
-- ============================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS association_id UUID REFERENCES associations(id);
CREATE INDEX IF NOT EXISTS idx_payments_association ON payments(association_id);

-- ============================================
-- DOCUMENTS (isolated per association)
-- ============================================
ALTER TABLE documents ADD COLUMN IF NOT EXISTS association_id UUID REFERENCES associations(id);
CREATE INDEX IF NOT EXISTS idx_documents_association ON documents(association_id);

-- ============================================
-- APPROVALS (isolated per association)
-- ============================================
-- Already has association_id, verify index
CREATE INDEX IF NOT EXISTS idx_approvals_association ON approvals(association_id);

-- ============================================
-- INSPECTIONS (isolated per association)
-- ============================================
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS association_id UUID REFERENCES associations(id);
CREATE INDEX IF NOT EXISTS idx_inspections_association ON inspections(association_id);

-- ============================================
-- COMMENTS/NOTES (isolated per association)
-- ============================================
-- Add if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS association_id UUID REFERENCES associations(id);
        CREATE INDEX IF NOT EXISTS idx_comments_association ON comments(association_id);
    END IF;
END $$;

-- ============================================
-- UPDATE RLS POLICIES
-- ============================================

-- Enable RLS on all tables if not already
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with association filtering
DROP POLICY IF EXISTS "Users can view contacts in their tenant" ON contacts;
DROP POLICY IF EXISTS "Users can view maintenance in their tenant" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can view compliance in their tenant" ON compliance_matters;
DROP POLICY IF EXISTS "Users can view payments in their tenant" ON payments;
DROP POLICY IF EXISTS "Users can view documents in their tenant" ON documents;
DROP POLICY IF EXISTS "Users can view inspections in their tenant" ON inspections;

-- Create new policies with association isolation
-- Portfolio admins can see all associations, association admins only their own

-- Contacts: isolated by association
CREATE POLICY "Users can view contacts in their associations" ON contacts
    FOR SELECT USING (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

CREATE POLICY "Users can insert contacts in their associations" ON contacts
    FOR INSERT WITH CHECK (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

CREATE POLICY "Users can update contacts in their associations" ON contacts
    FOR UPDATE USING (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

-- Maintenance: isolated by association
CREATE POLICY "Users can view maintenance in their associations" ON maintenance_requests
    FOR SELECT USING (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

CREATE POLICY "Users can insert maintenance in their associations" ON maintenance_requests
    FOR INSERT WITH CHECK (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

CREATE POLICY "Users can update maintenance in their associations" ON maintenance_requests
    FOR UPDATE USING (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

-- Compliance: isolated by association
CREATE POLICY "Users can view compliance in their associations" ON compliance_matters
    FOR SELECT USING (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

CREATE POLICY "Users can insert compliance in their associations" ON compliance_matters
    FOR INSERT WITH CHECK (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

CREATE POLICY "Users can update compliance in their associations" ON compliance_matters
    FOR UPDATE USING (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

-- Payments: isolated by association
CREATE POLICY "Users can view payments in their associations" ON payments
    FOR SELECT USING (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

CREATE POLICY "Users can insert payments in their associations" ON payments
    FOR INSERT WITH CHECK (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

-- Documents: isolated by association
CREATE POLICY "Users can view documents in their associations" ON documents
    FOR SELECT USING (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

CREATE POLICY "Users can insert documents in their associations" ON documents
    FOR INSERT WITH CHECK (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

-- Inspections: isolated by association
CREATE POLICY "Users can view inspections in their associations" ON inspections
    FOR SELECT USING (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

CREATE POLICY "Users can insert inspections in their associations" ON inspections
    FOR INSERT WITH CHECK (
        association_id IN (SELECT get_user_association_ids(auth.uid()))
        OR is_portfolio_admin(auth.uid())
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is portfolio admin (can see all associations)
CREATE OR REPLACE FUNCTION is_portfolio_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = $1 
        AND role IN ('PORTFOLIO_MANAGER', 'ADMIN_USER', 'PLATFORM_ADMIN')
        AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's association IDs
CREATE OR REPLACE FUNCTION get_user_association_ids(user_id UUID)
RETURNS TABLE(association_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ur.association_id
    FROM user_roles ur
    WHERE ur.user_id = $1
    AND ur.association_id IS NOT NULL
    AND ur.revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
