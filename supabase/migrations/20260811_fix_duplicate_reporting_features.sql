-- Fix duplicate reporting features
-- Remove 'reports.advanced' and keep 'advanced_reporting'

-- First, see what we have
-- SELECT id, code, name, category FROM features WHERE code LIKE '%report%';

-- Update tenant_entitlements referencing 'reports.advanced' to use 'advanced_reporting'
UPDATE tenant_entitlements te
SET feature_id = (SELECT id FROM features WHERE code = 'advanced_reporting')
WHERE feature_id IN (SELECT id FROM features WHERE code = 'reports.advanced');

-- Update plan_features referencing 'reports.advanced' to use 'advanced_reporting'
UPDATE plan_features pf
SET feature_id = (SELECT id FROM features WHERE code = 'advanced_reporting')
WHERE feature_id IN (SELECT id FROM features WHERE code = 'reports.advanced');

-- Now delete the duplicate 'reports.advanced' feature
DELETE FROM features WHERE code = 'reports.advanced';

-- Verify only one reporting feature remains
-- SELECT id, code, name FROM features WHERE code LIKE '%report%';
