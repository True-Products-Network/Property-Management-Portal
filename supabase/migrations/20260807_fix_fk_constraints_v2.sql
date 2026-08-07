-- Fix FK constraints - maintenance reported_by stays as contacts (residents may not have portal access)

-- ============================================
-- MAINTENANCE REQUESTS
-- ============================================

-- Drop CHECK constraints to allow any value
ALTER TABLE maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_category_check;

ALTER TABLE maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_urgency_check;

ALTER TABLE maintenance_requests
DROP CONSTRAINT IF EXISTS maintenance_requests_status_check;

-- Only update created_by and updated_by (reported_by_contact_id stays as contacts)
ALTER TABLE maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_created_by_fkey,
DROP CONSTRAINT IF EXISTS maintenance_requests_updated_by_fkey;

ALTER TABLE maintenance_requests
ADD CONSTRAINT maintenance_requests_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES portal_users(id),
ADD CONSTRAINT maintenance_requests_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES portal_users(id);

-- ============================================
-- INSPECTIONS
-- ============================================

-- Update FK constraints for inspections
ALTER TABLE inspections 
DROP CONSTRAINT IF EXISTS inspections_created_by_fkey,
DROP CONSTRAINT IF EXISTS inspections_updated_by_fkey;

ALTER TABLE inspections
ADD CONSTRAINT inspections_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES portal_users(id),
ADD CONSTRAINT inspections_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES portal_users(id);

-- ============================================
-- ADD COMPLIANCE FEATURE TO PLAN
-- ============================================

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
