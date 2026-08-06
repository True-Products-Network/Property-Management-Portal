-- Seed unit_type dropdown values with tenant_id
-- Run this in Supabase SQL Editor after getting your tenant ID

-- First, get the tenant ID (replace with your actual tenant ID)
-- SELECT id FROM tenants WHERE name = 'Test-True Products Network';

-- Then insert with tenant_id (replace 'YOUR_TENANT_ID' with actual UUID)
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, tenant_id, created_by, updated_by)
VALUES 
    ('unit', 'type', 'Studio', 'Studio', 1, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', NULL, NULL),
    ('unit', 'type', '1 Bedroom', '1 Bedroom', 2, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', NULL, NULL),
    ('unit', 'type', '2 Bedroom', '2 Bedroom', 3, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', NULL, NULL),
    ('unit', 'type', '3 Bedroom', '3 Bedroom', 4, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', NULL, NULL),
    ('unit', 'type', '4+ Bedroom', '4+ Bedroom', 5, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', NULL, NULL),
    ('unit', 'type', 'Penthouse', 'Penthouse', 6, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', NULL, NULL),
    ('unit', 'type', 'Loft', 'Loft', 7, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', NULL, NULL),
    ('unit', 'type', 'Townhouse', 'Townhouse', 8, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', NULL, NULL)
ON CONFLICT (record_type, field_name, value) DO UPDATE SET
    label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    tenant_id = EXCLUDED.tenant_id;
