-- Add missing features that the code expects but don't exist in the database

INSERT INTO features (code, name, description, category, default_limit, display_order) VALUES
    ('approvals', 'Approvals', 'Approval workflows for maintenance and other requests', 'operations', NULL, 23),
    ('maintenance_requests', 'Maintenance Requests', 'Maintenance request management', 'maintenance', NULL, 12),
    ('communications', 'Communications', 'Email and messaging features', 'operations', NULL, 24),
    ('vendors', 'Vendors', 'Vendor management', 'operations', NULL, 25),
    ('workflows', 'Workflows', 'Automated workflows', 'operations', NULL, 26),
    ('advanced_reporting', 'Advanced Reporting', 'Advanced analytics and reporting', 'reports', NULL, 52),
    ('api_access', 'API Access', 'API access for integrations', 'integrations', NULL, 61),
    ('bulk_operations', 'Bulk Operations', 'Bulk import and export operations', 'operations', NULL, 27)
ON CONFLICT (code) DO NOTHING;

-- Add these features to all existing plans (enable them by default)
INSERT INTO plan_features (plan_id, feature_id, is_enabled, limit_value)
SELECT 
    p.id as plan_id,
    f.id as feature_id,
    true as is_enabled,
    NULL as limit_value
FROM plans p
CROSS JOIN features f
WHERE f.code IN ('approvals', 'maintenance_requests', 'communications', 'vendors', 'workflows', 'advanced_reporting', 'api_access', 'bulk_operations')
ON CONFLICT (plan_id, feature_id) DO NOTHING;
