-- Verify Entity Hierarchy
-- Check that columns match the correct normalized structure

-- Expected:
-- Maintenance/Inspections: NO association_id, HAS property_id
-- Compliance/Documents/Payments: HAS association_id, optional property_id/unit_id
-- Contacts: HAS association_id (Tenant-level with optional Association)

SELECT 
    'maintenance_requests' as table_name,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'association_id') as has_association_id,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'property_id') as has_property_id,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'unit_id') as has_unit_id,
    'Property-level' as expected_level
UNION ALL
SELECT 
    'inspections',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspections' AND column_name = 'association_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspections' AND column_name = 'property_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspections' AND column_name = 'unit_id'),
    'Property-level'
UNION ALL
SELECT 
    'compliance_matters',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compliance_matters' AND column_name = 'association_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compliance_matters' AND column_name = 'property_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compliance_matters' AND column_name = 'unit_id'),
    'Association-level'
UNION ALL
SELECT 
    'documents',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'association_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'property_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'unit_id'),
    'Association-level'
UNION ALL
SELECT 
    'payment_records',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_records' AND column_name = 'association_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_records' AND column_name = 'property_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_records' AND column_name = 'unit_id'),
    'Association-level'
UNION ALL
SELECT 
    'contacts',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'association_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'property_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'unit_id'),
    'Tenant-level (optional Association)'
ORDER BY table_name;
