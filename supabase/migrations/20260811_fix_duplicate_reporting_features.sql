-- Fix duplicate reporting features
-- Remove 'reports.advanced' and keep 'advanced_reporting'

-- First, update tenant_entitlements referencing 'reports.advanced' to use 'advanced_reporting'
-- But skip if the tenant already has 'advanced_reporting' to avoid duplicates
UPDATE tenant_entitlements te
SET feature_id = (SELECT id FROM features WHERE code = 'advanced_reporting')
WHERE feature_id IN (SELECT id FROM features WHERE code = 'reports.advanced')
  AND NOT EXISTS (
    SELECT 1 FROM tenant_entitlements te2 
    WHERE te2.tenant_id = te.tenant_id 
    AND te2.feature_id = (SELECT id FROM features WHERE code = 'advanced_reporting')
  );

-- Delete any remaining tenant_entitlements that still reference 'reports.advanced'
-- (these are duplicates that couldn't be merged)
DELETE FROM tenant_entitlements 
WHERE feature_id IN (SELECT id FROM features WHERE code = 'reports.advanced');

-- For plan_features, we need to handle conflicts
-- First, delete entries that would cause duplicates
DELETE FROM plan_features pf
WHERE feature_id IN (SELECT id FROM features WHERE code = 'reports.advanced')
  AND EXISTS (
    SELECT 1 FROM plan_features pf2 
    WHERE pf2.plan_id = pf.plan_id 
    AND pf2.feature_id = (SELECT id FROM features WHERE code = 'advanced_reporting')
  );

-- Now update remaining plan_features
UPDATE plan_features pf
SET feature_id = (SELECT id FROM features WHERE code = 'advanced_reporting')
WHERE feature_id IN (SELECT id FROM features WHERE code = 'reports.advanced');

-- Now delete the duplicate 'reports.advanced' feature
DELETE FROM features WHERE code = 'reports.advanced';

-- Verify only one reporting feature remains
-- SELECT id, code, name FROM features WHERE code LIKE '%report%';
