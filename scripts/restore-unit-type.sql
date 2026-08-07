-- Restore Unit Type dropdown values (bedroom counts + special types)
-- These were accidentally deleted from record_type='unit' (lowercase)

INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, tenant_id, is_active)
VALUES 
    ('Unit', 'type', 'studio', 'Studio', 1, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', true),
    ('Unit', 'type', '1_bedroom', '1 Bedroom', 2, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', true),
    ('Unit', 'type', '2_bedroom', '2 Bedroom', 3, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', true),
    ('Unit', 'type', '3_bedroom', '3 Bedroom', 4, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', true),
    ('Unit', 'type', '4_bedroom', '4+ Bedroom', 5, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', true),
    ('Unit', 'type', 'penthouse', 'Penthouse', 6, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', true),
    ('Unit', 'type', 'loft', 'Loft', 7, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', true),
    ('Unit', 'type', 'townhouse', 'Townhouse', 8, '93f8cdcf-7dcd-4d83-8117-67d869eab88b', true)
ON CONFLICT (record_type, field_name, value) DO UPDATE SET
    label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

-- Verify the data is restored
SELECT 
    record_type,
    field_name,
    value,
    label,
    sort_order
FROM dropdown_settings 
WHERE record_type = 'Unit' AND field_name = 'type'
ORDER BY sort_order;
