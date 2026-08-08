-- Fix Entity Hierarchy
-- Remove incorrect association_id from Property-level entities
-- Ensure proper property_id columns exist for Association-level entities

-- ============================================
-- STEP 1: Remove association_id from Property-level entities
-- ============================================

-- Maintenance Requests should be Property-level (not Association-level)
-- Remove association_id column
ALTER TABLE maintenance_requests DROP COLUMN IF EXISTS association_id;

-- Inspections should be Property-level (not Association-level)
-- Remove association_id column
ALTER TABLE inspections DROP COLUMN IF EXISTS association_id;

-- ============================================
=== STEP 2: Ensure property_id exists on Association-level entities
-- These entities are owned by Association but can optionally reference a Property
-- ============================================

-- Compliance matters - add property_id if missing
ALTER TABLE compliance_matters ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);
CREATE INDEX IF NOT EXISTS idx_compliance_property ON compliance_matters(property_id);

-- Documents - property_id should already exist, verify
ALTER TABLE documents ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);
CREATE INDEX IF NOT EXISTS idx_documents_property ON documents(property_id);

-- Payment Records - add property_id if missing
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);
CREATE INDEX IF NOT EXISTS idx_payment_records_property ON payment_records(property_id);

-- ============================================
-- STEP 3: Verify unit_id columns exist where needed
-- ============================================

-- Compliance can optionally reference a Unit
ALTER TABLE compliance_matters ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);
CREATE INDEX IF NOT EXISTS idx_compliance_unit ON compliance_matters(unit_id);

-- Documents can optionally reference a Unit
ALTER TABLE documents ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);
CREATE INDEX IF NOT EXISTS idx_documents_unit ON documents(unit_id);

-- Payment Records can optionally reference a Unit
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);
CREATE INDEX IF NOT EXISTS idx_payment_records_unit ON payment_records(unit_id);

-- Maintenance already has unit_id (correct)
-- Inspections already has unit_id (correct)

-- ============================================
-- STEP 4: Update RLS policies for corrected hierarchy
-- ============================================

-- Drop old policies that referenced association_id for maintenance/inspections
DROP POLICY IF EXISTS "Users can view maintenance in their associations" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can insert maintenance in their associations" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can update maintenance in their associations" ON maintenance_requests;

DROP POLICY IF EXISTS "Users can view inspections in their associations" ON inspections;
DROP POLICY IF EXISTS "Users can insert inspections in their associations" ON inspections;
DROP POLICY IF EXISTS "Users can update inspections in their associations" ON inspections;

-- Create new policies for maintenance_requests (via property → association)
CREATE POLICY "Users can view maintenance via property" ON maintenance_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = maintenance_requests.property_id
            AND (p.association_id IN (SELECT get_user_association_ids(auth.uid()))
                OR is_portfolio_admin(auth.uid()))
        )
    );

CREATE POLICY "Users can insert maintenance via property" ON maintenance_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = maintenance_requests.property_id
            AND (p.association_id IN (SELECT get_user_association_ids(auth.uid()))
                OR is_portfolio_admin(auth.uid()))
        )
    );

CREATE POLICY "Users can update maintenance via property" ON maintenance_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = maintenance_requests.property_id
            AND (p.association_id IN (SELECT get_user_association_ids(auth.uid()))
                OR is_portfolio_admin(auth.uid()))
        )
    );

-- Create new policies for inspections (via property → association)
CREATE POLICY "Users can view inspections via property" ON inspections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = inspections.property_id
            AND (p.association_id IN (SELECT get_user_association_ids(auth.uid()))
                OR is_portfolio_admin(auth.uid()))
        )
    );

CREATE POLICY "Users can insert inspections via property" ON inspections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = inspections.property_id
            AND (p.association_id IN (SELECT get_user_association_ids(auth.uid()))
                OR is_portfolio_admin(auth.uid()))
        )
    );

CREATE POLICY "Users can update inspections via property" ON inspections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = inspections.property_id
            AND (p.association_id IN (SELECT get_user_association_ids(auth.uid()))
                OR is_portfolio_admin(auth.uid()))
        )
    );

-- ============================================
-- STEP 5: Clean up old indexes
-- ============================================

DROP INDEX IF EXISTS idx_maintenance_association;
DROP INDEX IF EXISTS idx_inspections_association;

-- ============================================
-- STEP 6: Add helpful comments
-- ============================================

COMMENT ON TABLE maintenance_requests IS 'Property-level entity. Links to Property (required) and optionally Unit. Access controlled via Property → Association chain.';
COMMENT ON TABLE inspections IS 'Property-level entity. Links to Property (required) and optionally Unit. Access controlled via Property → Association chain.';
COMMENT ON TABLE compliance_matters IS 'Association-level entity. Links to Association (required) and optionally Property or Unit.';
COMMENT ON TABLE documents IS 'Association-level entity. Links to Association (required) and optionally Property or Unit.';
COMMENT ON TABLE payment_records IS 'Association-level entity. Links to Association (required) and optionally Property or Unit.';
