-- Seed unit_type dropdown values
-- Run this in Supabase SQL Editor

INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default, created_by, updated_by)
VALUES 
    ('unit', 'type', 'Studio', 'Studio', 1, false, NULL, NULL),
    ('unit', 'type', '1 Bedroom', '1 Bedroom', 2, false, NULL, NULL),
    ('unit', 'type', '2 Bedroom', '2 Bedroom', 3, false, NULL, NULL),
    ('unit', 'type', '3 Bedroom', '3 Bedroom', 4, false, NULL, NULL),
    ('unit', 'type', '4+ Bedroom', '4+ Bedroom', 5, false, NULL, NULL),
    ('unit', 'type', 'Penthouse', 'Penthouse', 6, false, NULL, NULL),
    ('unit', 'type', 'Loft', 'Loft', 7, false, NULL, NULL),
    ('unit', 'type', 'Townhouse', 'Townhouse', 8, false, NULL, NULL)
ON CONFLICT (record_type, field_name, value) DO UPDATE SET
    label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;
