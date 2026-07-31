-- Seed Test Data for Property Management Portal
-- Run this to populate the database with sample data for testing

-- ============================================
-- TEST ASSOCIATIONS
-- ============================================

INSERT INTO associations (
    id, association_id, name, legal_name, type, status,
    address_street, address_city, address_state, address_zip,
    phone, email, fiscal_year, annual_meeting_month,
    management_start_date, created_at, updated_at
) VALUES 
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'TEST-ASSOC-001', 'Ridgeland Condominium Association', 'Ridgeland Condominium Association, Inc.', 'Condominium', 'active',
    '6722 S Ridgeland Ave', 'Chicago', 'IL', '60649',
    '(773) 555-0123', 'board@ridgelandcondo.org', 'January - December', 'May',
    '2024-01-01', NOW(), NOW()
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'TEST-ASSOC-002', 'Oakwood HOA', 'Oakwood Homeowners Association', 'HOA', 'active',
    '123 Oakwood Drive', 'Springfield', 'IL', '62704',
    '(217) 555-0456', 'info@oakwoodhoa.org', 'July - June', 'August',
    '2023-06-01', NOW(), NOW()
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'TEST-ASSOC-003', 'Marina Towers Cooperative', 'Marina Towers Cooperative Housing Corporation', 'Cooperative', 'active',
    '300 N State Street', 'Chicago', 'IL', '60654',
    '(312) 555-0789', 'board@marinatowers.org', 'Calendar Year', 'March',
    '2024-03-15', NOW(), NOW()
);

-- ============================================
-- TEST PROPERTIES
-- ============================================

INSERT INTO properties (
    id, property_id, association_id, name, address_street, address_city, address_state, address_zip,
    type, status, year_built, total_units, management_start_date, created_at, updated_at
) VALUES
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'TEST-PROP-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Ridgeland Condominiums', '6722 S Ridgeland Ave', 'Chicago', 'IL', '60649',
    'Condominium', 'active', 1985, 12, '2024-01-01', NOW(), NOW()
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'TEST-PROP-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Oakwood Estates', '123 Oakwood Drive', 'Springfield', 'IL', '62704',
    'Single Family', 'active', 2005, 45, '2023-06-01', NOW(), NOW()
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'TEST-PROP-003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Oakwood Townhomes', '456 Maple Lane', 'Springfield', 'IL', '62704',
    'Townhouse', 'active', 2010, 24, '2023-06-01', NOW(), NOW()
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'TEST-PROP-004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'Marina Towers East', '300 N State Street', 'Chicago', 'IL', '60654',
    'Condominium', 'active', 1964, 200, '2024-03-15', NOW(), NOW()
);

-- ============================================
-- TEST UNITS
-- ============================================

INSERT INTO units (
    id, unit_id, property_id, unit_number, display_name, type, status,
    square_feet, bedrooms, bathrooms, floor, occupancy_status, created_at, updated_at
) VALUES
-- Ridgeland Condominiums units
('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'TEST-UNIT-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '1N', 'Unit 1 North', '2 Bedroom', 'occupied', 950, 2, 1.0, '1', 'owner_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'TEST-UNIT-002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '1S', 'Unit 1 South', '2 Bedroom', 'occupied', 950, 2, 1.0, '1', 'tenant_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'TEST-UNIT-003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '2N', 'Unit 2 North', '3 Bedroom', 'occupied', 1200, 3, 2.0, '2', 'owner_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'TEST-UNIT-004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '2S', 'Unit 2 South', '1 Bedroom', 'vacant', 750, 1, 1.0, '2', 'vacant', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'TEST-UNIT-005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '3N', 'Unit 3 North', '2 Bedroom', 'occupied', 950, 2, 1.0, '3', 'owner_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc6', 'TEST-UNIT-006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '3S', 'Unit 3 South', 'Studio', 'occupied', 500, 0, 1.0, '3', 'tenant_occupied', NOW(), NOW());

-- ============================================
-- TEST CONTACTS
-- ============================================

INSERT INTO contacts (
    id, contact_id, first_name, last_name, email, phone, mobile_phone,
    preferred_contact_method, email_permission, sms_permission,
    portal_invitation_status, created_at, updated_at
) VALUES
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'TEST-CONT-001', 'John', 'Smith', 'john.smith@email.com', '(773) 555-1001', '(773) 555-1002',
    'email', true, true, 'active', NOW(), NOW()
),
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd2', 'TEST-CONT-002', 'Jane', 'Doe', 'jane.doe@email.com', '(773) 555-2001', '(773) 555-2002',
    'email', true, false, 'active', NOW(), NOW()
),
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd3', 'TEST-CONT-003', 'Michael', 'Johnson', 'michael.j@email.com', '(217) 555-3001', '(217) 555-3002',
    'phone', true, true, 'active', NOW(), NOW()
),
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd4', 'TEST-CONT-004', 'Sarah', 'Williams', 'sarah.w@email.com', '(312) 555-4001', '(312) 555-4002',
    'email', true, true, 'active', NOW(), NOW()
),
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd5', 'TEST-CONT-005', 'Robert', 'Brown', 'robert.brown@email.com', '(773) 555-5001', '(773) 555-5002',
    'sms', false, true, 'invited', NOW(), NOW()
);

-- ============================================
-- TEST CONTACT ROLES
-- ============================================

INSERT INTO contact_roles (
    id, contact_id, role_type, association_id, property_id, unit_id, is_primary, is_active, created_at, updated_at
) VALUES
-- John Smith - Board President at Ridgeland
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'board_president', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', true, true, NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'owner', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', true, true, NOW(), NOW()),

-- Jane Doe - Board Treasurer at Ridgeland
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', 'board_treasurer', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', true, true, NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', 'owner', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', true, true, NOW(), NOW()),

-- Michael Johnson - Owner at Oakwood
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'dddddddd-dddd-dddd-dddd-ddddddddddd3', 'owner', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', null, true, true, NOW(), NOW()),

-- Sarah Williams - Tenant at Marina Towers
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', 'tenant', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', null, true, true, NOW(), NOW()),

-- Robert Brown - Owner at Ridgeland
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7', 'dddddddd-dddd-dddd-dddd-ddddddddddd5', 'owner', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc5', true, true, NOW(), NOW());

-- ============================================
-- TEST VENDORS
-- ============================================

INSERT INTO vendors (
    id, vendor_id, company_name, category, status, primary_contact_name, email, phone,
    license_number, rating, total_jobs, created_at, updated_at
) VALUES
(
    'ffffffff-ffff-ffff-ffff-fffffffffff1', 'TEST-VEND-001', 'ABC Plumbing & Heating', 'Plumbing', 'active',
    'Tom Wilson', 'tom@abcplumbing.com', '(773) 555-6001',
    'PL-12345', 4.5, 12, NOW(), NOW()
),
(
    'ffffffff-ffff-ffff-ffff-fffffffffff2', 'TEST-VEND-002', 'Cool Air HVAC Services', 'HVAC', 'active',
    'Lisa Garcia', 'lisa@coolairhvac.com', '(312) 555-7001',
    'HVAC-98765', 4.8, 8, NOW(), NOW()
),
(
    'ffffffff-ffff-ffff-ffff-fffffffffff3', 'TEST-VEND-003', 'Green Thumb Landscaping', 'Landscaping', 'active',
    'Mike Davis', 'mike@greenthumb.com', '(217) 555-8001',
    null, 4.2, 15, NOW(), NOW()
),
(
    'ffffffff-ffff-ffff-ffff-fffffffffff4', 'TEST-VEND-004', 'Spark Electric Co', 'Electrical', 'active',
    'Jennifer Lee', 'jen@sparkelectric.com', '(773) 555-9001',
    'ELEC-54321', 4.7, 6, NOW(), NOW()
);

-- ============================================
-- TEST MAINTENANCE REQUESTS
-- ============================================

INSERT INTO maintenance_requests (
    id, request_number, property_id, unit_id, reported_by_contact_id, assigned_vendor_id,
    title, description, category, urgency, status, estimated_cost, scheduled_date, created_at, updated_at
) VALUES
(
    '11111111-1111-1111-1111-111111111111', 'TEST-MNT-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'ffffffff-ffff-ffff-ffff-fffffffffff1',
    'Leaking faucet in kitchen', 'The kitchen faucet has been dripping constantly for 3 days', 'Plumbing', 'normal',
    'scheduled', 150.00, '2026-08-05', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111112', 'TEST-MNT-002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2', 'ffffffff-ffff-ffff-ffff-fffffffffff2',
    'AC not cooling properly', 'Unit is blowing warm air, temperature is 85F inside', 'HVAC', 'urgent',
    'in_progress', 450.00, '2026-08-02', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111113', 'TEST-MNT-003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', null,
    'dddddddd-dddd-dddd-dddd-ddddddddddd1', null,
    'Parking lot light out', 'Light pole #3 in north parking lot is not working', 'Electrical', 'low',
    'new', 200.00, null, NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111114', 'TEST-MNT-004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', null,
    'dddddddd-dddd-dddd-dddd-ddddddddddd3', 'ffffffff-ffff-ffff-ffff-fffffffffff3',
    'Lawn maintenance needed', 'Common areas need mowing and edging', 'Landscaping', 'normal',
    'completed', 350.00, '2026-07-28', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111115', 'TEST-MNT-005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2', null,
    'Emergency water leak', 'Water coming through ceiling in bathroom', 'Plumbing', 'emergency',
    'vendor_assigned', 800.00, '2026-08-01', NOW(), NOW()
);

-- ============================================
-- TEST INSPECTIONS
-- ============================================

INSERT INTO inspections (
    id, inspection_id, property_id, inspection_type, status, scheduled_date, created_at, updated_at
) VALUES
(
    '22222222-2222-2222-2222-222222222221', 'TEST-INSP-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'annual', 'scheduled', '2026-08-15', NOW(), NOW()
),
(
    '22222222-2222-2222-2222-222222222222', 'TEST-INSP-002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'fire_safety', 'completed', '2026-07-01', NOW(), NOW()
),
(
    '22222222-2222-2222-2222-222222222223', 'TEST-INSP-003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'annual', 'overdue', '2026-06-01', NOW(), NOW()
);

-- ============================================
-- TEST DOCUMENTS
-- ============================================

INSERT INTO documents (
    id, document_id, title, file_name, file_path, document_type, status,
    issue_date, expiry_date, association_id, property_id, is_confidential, requires_acknowledgment, uploaded_by, created_at
) VALUES
(
    '33333333-3333-3333-3333-333333333331', 'TEST-DOC-001', 'Insurance Certificate 2026', 'insurance_cert_2026.pdf', '/docs/insurance_cert_2026.pdf',
    'insurance', 'active', '2026-01-01', '2027-01-01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', null,
    false, false, '00000000-0000-0000-0000-000000000000', NOW()
),
(
    '33333333-3333-3333-3333-333333333332', 'TEST-DOC-002', 'Annual Budget 2026', 'budget_2026.xlsx', '/docs/budget_2026.xlsx',
    'financial', 'active', '2026-01-15', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', null,
    false, false, '00000000-0000-0000-0000-000000000000', NOW()
),
(
    '33333333-3333-3333-3333-333333333333', 'TEST-DOC-003', 'Fire Safety Inspection Report', 'fire_inspection_2026.pdf', '/docs/fire_inspection_2026.pdf',
    'inspection_report', 'active', '2026-07-01', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    false, true, '00000000-0000-0000-0000-000000000000', NOW()
);

-- ============================================
-- TEST COMPLIANCE MATTERS
-- ============================================

INSERT INTO compliance_matters (
    id, matter_id, association_id, property_id, title, description, category, priority, status,
    identified_date, due_date, created_at, updated_at
) VALUES
(
    '44444444-4444-4444-4444-444444444441', 'TEST-COMP-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Annual Fire Inspection', 'Required annual fire safety inspection for common areas', 'fire_safety', 'high', 'open',
    '2026-07-01', '2026-08-15', NOW(), NOW()
),
(
    '44444444-4444-4444-4444-444444444442', 'TEST-COMP-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', null,
    'Elevator Certification Renewal', 'Annual elevator safety certification needs renewal', 'elevator', 'critical', 'open',
    '2026-07-15', '2026-09-01', NOW(), NOW()
),
(
    '44444444-4444-4444-4444-444444444443', 'TEST-COMP-003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'Pool Safety Compliance', 'Pool fence and safety equipment inspection', 'safety', 'medium', 'resolved',
    '2026-06-01', '2026-06-30', NOW(), NOW()
);

-- ============================================
-- TEST APPROVALS
-- ============================================

INSERT INTO approvals (
    id, approval_id, association_id, title, description, approval_type, requested_amount, status,
    requested_by, requested_at, created_at, updated_at
) VALUES
(
    '55555555-5555-5555-5555-555555555551', 'TEST-APPR-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'HVAC System Replacement', 'Replace aging HVAC system in common areas', 'capital_improvement', 15000.00,
    'pending', '00000000-0000-0000-0000-000000000000', NOW(), NOW(), NOW()
),
(
    '55555555-5555-5555-5555-555555555552', 'TEST-APPR-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Landscaping Contract 2026-2027', 'Annual landscaping maintenance contract renewal', 'vendor_contract', 8500.00,
    'approved', '00000000-0000-0000-0000-000000000000', NOW() - INTERVAL '7 days', NOW(), NOW()
);

-- ============================================
-- TEST COMMUNICATIONS
-- ============================================

INSERT INTO communications (
    id, communication_id, association_id, subject, content, type, send_to_all, status,
    created_by, sent_at, created_at, updated_at
) VALUES
(
    '66666666-6666-6666-6666-666666666661', 'TEST-COMM-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Pool Maintenance Schedule', 'The pool will be closed for maintenance on August 10-12.', 'announcement', true, 'sent',
    '00000000-0000-0000-0000-000000000000', NOW() - INTERVAL '2 days', NOW(), NOW()
),
(
    '66666666-6666-6666-6666-666666666662', 'TEST-COMM-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Annual Meeting Notice', 'Annual meeting scheduled for May 15, 2026 at 7:00 PM', 'notice', true, 'sent',
    '00000000-0000-0000-0000-000000000000', NOW() - INTERVAL '5 days', NOW(), NOW()
),
(
    '66666666-6666-6666-6666-666666666663', 'TEST-COMM-003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Reminder: Assessment Due', 'Quarterly assessment payment is due by August 15', 'reminder', true, 'draft',
    '00000000-0000-0000-0000-000000000000', null, NOW(), NOW()
);

-- ============================================
-- TEST PAYMENT RECORDS
-- ============================================

INSERT INTO payment_records (
    id, payment_id, association_id, contact_id, payment_type, amount, processor, status,
    initiated_at, completed_at, created_at
) VALUES
(
    '77777777-7777-7777-7777-777777777771', 'TEST-PAY-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'assessment', 350.00, 'stripe', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW()
),
(
    '77777777-7777-7777-7777-777777777772', 'TEST-PAY-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'assessment', 350.00, 'stripe', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW()
),
(
    '77777777-7777-7777-7777-777777777773', 'TEST-PAY-003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    'late_fee', 25.00, 'paypal', 'pending', NOW(), null, NOW()
);

-- ============================================
-- TEST APPOINTMENTS
-- ============================================

INSERT INTO appointments (
    id, appointment_id, association_id, title, appointment_type, start_time, end_time, location,
    property_id, organizer_id, status, created_at, updated_at
) VALUES
(
    '88888888-8888-8888-8888-888888888881', 'TEST-APT-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Annual Inspection - Ridgeland', 'inspection', '2026-08-15 09:00:00', '2026-08-15 12:00:00',
    '6722 S Ridgeland Ave', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '00000000-0000-0000-0000-000000000000', 'scheduled', NOW(), NOW()
),
(
    '88888888-8888-8888-8888-888888888882', 'TEST-APT-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Board Meeting - August', 'meeting', '2026-08-10 19:00:00', '2026-08-10 21:00:00',
    'Community Room', null, '00000000-0000-0000-0000-000000000000', 'scheduled', NOW(), NOW()
);

-- ============================================
-- SEED COMPLETE
-- ============================================

SELECT 'Seed data inserted successfully!' as result;
