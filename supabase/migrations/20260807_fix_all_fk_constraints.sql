-- Fix FK constraints and CHECK constraints for maintenance_requests, inspections, and compliance

-- ============================================
-- MAINTENANCE REQUESTS
-- ============================================

-- Drop the CHECK constraint on category to allow any value
ALTER TABLE maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_category_check;

-- Also drop urgency check if it exists
ALTER TABLE maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_urgency_check;

-- Drop status check if it exists  
ALTER TABLE maintenance_requests
DROP CONSTRAINT IF EXISTS maintenance_requests_status_check;

-- Update FK constraints to reference portal_users instead of contacts
ALTER TABLE maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_reported_by_fkey,
DROP CONSTRAINT IF EXISTS maintenance_requests_created_by_fkey,
DROP CONSTRAINT IF EXISTS maintenance_requests_updated_by_fkey;

ALTER TABLE maintenance_requests
ADD CONSTRAINT maintenance_requests_reported_by_fkey 
    FOREIGN KEY (reported_by) REFERENCES portal_users(id),
ADD CONSTRAINT maintenance_requests_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES portal_users(id),
ADD CONSTRAINT maintenance_requests_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES portal_users(id);

-- ============================================
-- INSPECTIONS
-- ============================================

-- Drop and recreate FK constraints for inspections
ALTER TABLE inspections 
DROP CONSTRAINT IF EXISTS inspections_inspector_id_fkey,
DROP CONSTRAINT IF EXISTS inspections_created_by_fkey,
DROP CONSTRAINT IF EXISTS inspections_updated_by_fkey;

ALTER TABLE inspections
ADD CONSTRAINT inspections_inspector_id_fkey 
    FOREIGN KEY (inspector_id) REFERENCES portal_users(id),
ADD CONSTRAINT inspections_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES portal_users(id),
ADD CONSTRAINT inspections_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES portal_users(id);

-- ============================================
-- COMPLIANCE MATTERS (verify constraints are correct)
-- ============================================

-- Compliance matters should already be correct, but verify
-- If they reference contacts, update them to portal_users

-- First check what the current constraints reference
-- (This will be done manually if needed)

-- ============================================
-- ADD COMPLIANCE FEATURE TO PLAN
-- ============================================

-- Link compliance feature to the plan if not already linked
INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
SELECT 
    p.id as plan_id,
    f.id as feature_id,
    true as is_enabled,
    NULL as limit_value
FROM plans p
CROSS JOIN features f
WHERE f.code = 'compliance'
AND p.id = '924f11db-d8ee-4ab4-bb07-90cc818f7278'
ON CONFLICT (plan_id, feature_id) DO NOTHING;
