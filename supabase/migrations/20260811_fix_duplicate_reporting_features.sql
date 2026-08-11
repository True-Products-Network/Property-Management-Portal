-- Fix duplicate reporting features
-- Check if both 'reporting' and 'reports' exist and remove the duplicate

-- First, see what we have
-- SELECT id, code, name, category FROM features WHERE code IN ('reporting', 'reports');

-- If both exist, we need to:
-- 1. Update any tenant_entitlements referencing 'reports' to use 'reporting'
-- 2. Delete the 'reports' feature

-- Update tenant_entitlements to use 'reporting' instead of 'reports'
UPDATE tenant_entitlements te
SET feature_id = (SELECT id FROM features WHERE code = 'reporting')
WHERE feature_id IN (SELECT id FROM features WHERE code = 'reports');

-- Now delete the duplicate 'reports' feature
DELETE FROM features WHERE code = 'reports';

-- Verify only one reporting feature remains
-- SELECT id, code, name FROM features WHERE code = 'reporting';
