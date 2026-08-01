-- Seed Test Data for Property Management Portal
-- Run this to populate the database with sample data for testing

-- ============================================
-- TEST ASSOCIATIONS (3)
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
-- TEST PROPERTIES (4)
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
-- TEST UNITS (12+)
-- ============================================

INSERT INTO units (
    id, unit_id, property_id, unit_number, display_name, type, status,
    square_feet, bedrooms, bathrooms, floor, occupancy_status, created_at, updated_at
) VALUES
-- Ridgeland Condominiums units (6)
('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'TEST-UNIT-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '1N', 'Unit 1 North', '2 Bedroom', 'occupied', 950, 2, 1.0, '1', 'owner_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'TEST-UNIT-002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '1S', 'Unit 1 South', '2 Bedroom', 'occupied', 950, 2, 1.0, '1', 'tenant_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'TEST-UNIT-003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '2N', 'Unit 2 North', '3 Bedroom', 'occupied', 1200, 3, 2.0, '2', 'owner_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'TEST-UNIT-004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '2S', 'Unit 2 South', '1 Bedroom', 'vacant', 750, 1, 1.0, '2', 'vacant', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'TEST-UNIT-005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '3N', 'Unit 3 North', '2 Bedroom', 'occupied', 950, 2, 1.0, '3', 'owner_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc6', 'TEST-UNIT-006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '3S', 'Unit 3 South', 'Studio', 'occupied', 500, 0, 1.0, '3', 'tenant_occupied', NOW(), NOW()),
-- Oakwood Townhomes units (4)
('cccccccc-cccc-cccc-cccc-ccccccccccc7', 'TEST-UNIT-007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '101', 'Townhome 101', '3 Bedroom', 'occupied', 1800, 3, 2.5, '1', 'owner_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc8', 'TEST-UNIT-008', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '102', 'Townhome 102', '3 Bedroom', 'occupied', 1800, 3, 2.5, '1', 'owner_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccc9', 'TEST-UNIT-009', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '103', 'Townhome 103', '2 Bedroom', 'occupied', 1500, 2, 2.0, '1', 'tenant_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-ccccccccccca', 'TEST-UNIT-010', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '104', 'Townhome 104', '3 Bedroom', 'vacant', 1800, 3, 2.5, '1', 'vacant', NOW(), NOW()),
-- Marina Towers units (2)
('cccccccc-cccc-cccc-cccc-cccccccccccb', 'TEST-UNIT-011', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '15A', 'Unit 15A', '2 Bedroom', 'occupied', 1100, 2, 2.0, '15', 'owner_occupied', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'TEST-UNIT-012', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '22B', 'Unit 22B', '1 Bedroom', 'occupied', 800, 1, 1.0, '22', 'tenant_occupied', NOW(), NOW());

-- ============================================
-- TEST CONTACTS (10+)
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
),
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd6', 'TEST-CONT-006', 'Emily', 'Davis', 'emily.davis@email.com', '(217) 555-6001', '(217) 555-6002',
    'email', true, true, 'active', NOW(), NOW()
),
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd7', 'TEST-CONT-007', 'David', 'Wilson', 'david.wilson@email.com', '(312) 555-7001', '(312) 555-7002',
    'email', true, false, 'active', NOW(), NOW()
),
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd8', 'TEST-CONT-008', 'Lisa', 'Anderson', 'lisa.anderson@email.com', '(773) 555-8001', '(773) 555-8002',
    'sms', true, true, 'pending', NOW(), NOW()
),
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd9', 'TEST-CONT-009', 'James', 'Taylor', 'james.taylor@email.com', '(217) 555-9001', '(217) 555-9002',
    'email', true, true, 'active', NOW(), NOW()
),
(
    'dddddddd-dddd-dddd-dddd-ddddddddddda', 'TEST-CONT-010', 'Amanda', 'Martinez', 'amanda.martinez@email.com', '(312) 555-1001', '(312) 555-1002',
    'email', true, true, 'active', NOW(), NOW()
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
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', 'tenant', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'cccccccc-cccc-cccc-cccc-cccccccccccb', true, true, NOW(), NOW()),

-- Robert Brown - Owner at Ridgeland
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7', 'dddddddd-dddd-dddd-dddd-ddddddddddd5', 'owner', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc5', true, true, NOW(), NOW()),

-- Emily Davis - Board Secretary at Oakwood
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee8', 'dddddddd-dddd-dddd-dddd-ddddddddddd6', 'board_secretary', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'cccccccc-cccc-cccc-cccc-ccccccccccc7', true, true, NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee9', 'dddddddd-dddd-dddd-dddd-ddddddddddd6', 'owner', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'cccccccc-cccc-cccc-cccc-ccccccccccc7', true, true, NOW(), NOW()),

-- David Wilson - Board Member at Marina Towers
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeea', 'dddddddd-dddd-dddd-dddd-ddddddddddd7', 'board_member', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'cccccccc-cccc-cccc-cccc-cccccccccccb', true, true, NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeeb', 'dddddddd-dddd-dddd-dddd-ddddddddddd7', 'owner', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'cccccccc-cccc-cccc-cccc-cccccccccccb', true, true, NOW(), NOW()),

-- Lisa Anderson - Tenant at Oakwood Townhomes
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeec', 'dddddddd-dddd-dddd-dddd-ddddddddddd8', 'tenant', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'cccccccc-cccc-cccc-cccc-ccccccccccc9', true, true, NOW(), NOW()),

-- James Taylor - Vendor Contact
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeed', 'dddddddd-dddd-dddd-dddd-ddddddddddd9', 'vendor_contact', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', null, null, true, true, NOW(), NOW()),

-- Amanda Martinez - Management Staff
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-ddddddddddda', 'management_staff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', null, null, true, true, NOW(), NOW());

-- ============================================
-- TEST VENDORS (6+)
-- ============================================

INSERT INTO vendors (
    id, vendor_id, company_name, dba_name, category, status, primary_contact_name, email, phone, emergency_phone,
    address_street, address_city, address_state, address_zip,
    license_number, insurance_expiry, license_expiry, rating, total_jobs, created_at, updated_at
) VALUES
(
    'ffffffff-ffff-ffff-ffff-fffffffffff1', 'TEST-VEND-001', 'ABC Plumbing & Heating', 'ABC Plumbing', 'Plumbing', 'active',
    'Tom Wilson', 'tom@abcplumbing.com', '(773) 555-6001', '(773) 555-6002',
    '123 Main St', 'Chicago', 'IL', '60601',
    'PL-12345', '2027-03-15', '2026-12-31', 4.5, 12, NOW(), NOW()
),
(
    'ffffffff-ffff-ffff-ffff-fffffffffff2', 'TEST-VEND-002', 'Cool Air HVAC Services', NULL, 'HVAC', 'active',
    'Lisa Garcia', 'lisa@coolairhvac.com', '(312) 555-7001', '(312) 555-7002',
    '456 Oak Ave', 'Chicago', 'IL', '60602',
    'HVAC-98765', '2027-06-20', '2026-11-30', 4.8, 8, NOW(), NOW()
),
(
    'ffffffff-ffff-ffff-ffff-fffffffffff3', 'TEST-VEND-003', 'Green Thumb Landscaping', 'Green Thumb', 'Landscaping', 'active',
    'Mike Davis', 'mike@greenthumb.com', '(217) 555-8001', '(217) 555-8002',
    '789 Pine Rd', 'Springfield', 'IL', '62701',
    NULL, '2027-01-10', NULL, 4.2, 15, NOW(), NOW()
),
(
    'ffffffff-ffff-ffff-ffff-fffffffffff4', 'TEST-VEND-004', 'Spark Electric Co', 'Spark Electric', 'Electrical', 'active',
    'Jennifer Lee', 'jen@sparkelectric.com', '(773) 555-9001', '(773) 555-9002',
    '321 Elm St', 'Chicago', 'IL', '60603',
    'ELEC-54321', '2027-04-25', '2026-10-15', 4.7, 6, NOW(), NOW()
),
(
    'ffffffff-ffff-ffff-ffff-fffffffffff5', 'TEST-VEND-005', 'SecureLock Locksmiths', 'SecureLock', 'Locksmith', 'active',
    'Robert Chen', 'robert@securelock.com', '(312) 555-1101', '(312) 555-1102',
    '555 Security Blvd', 'Chicago', 'IL', '60604',
    'LOCK-78901', '2027-02-28', '2026-09-30', 4.9, 23, NOW(), NOW()
),
(
    'ffffffff-ffff-ffff-ffff-fffffffffff6', 'TEST-VEND-006', 'Elite Roofing Solutions', 'Elite Roofing', 'Roofing', 'active',
    'Karen White', 'karen@eliteroofing.com', '(217) 555-2201', '(217) 555-2202',
    '888 Roof Ln', 'Springfield', 'IL', '62702',
    'ROOF-45678', '2027-05-15', '2026-08-31', 4.4, 18, NOW(), NOW()
);

-- ============================================
-- TEST MAINTENANCE REQUESTS (8+)
-- ============================================

INSERT INTO maintenance_requests (
    id, request_number, property_id, unit_id, reported_by_contact_id, assigned_vendor_id,
    title, description, category, urgency, status, estimated_cost, actual_cost, scheduled_date, requested_date, created_at, updated_at
) VALUES
(
    '11111111-1111-1111-1111-111111111111', 'TEST-MNT-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'ffffffff-ffff-ffff-ffff-fffffffffff1',
    'Leaking faucet in kitchen', 'The kitchen faucet has been dripping constantly for 3 days', 'Plumbing', 'normal',
    'scheduled', 150.00, NULL, '2026-08-05', '2026-08-01', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111112', 'TEST-MNT-002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2', 'ffffffff-ffff-ffff-ffff-fffffffffff2',
    'AC not cooling properly', 'Unit is blowing warm air, temperature is 85F inside', 'HVAC', 'urgent',
    'in_progress', 450.00, NULL, '2026-08-02', '2026-08-01', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111113', 'TEST-MNT-003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NULL,
    'dddddddd-dddd-dddd-dddd-ddddddddddd1', NULL,
    'Parking lot light out', 'Light pole #3 in north parking lot is not working', 'Electrical', 'low',
    'new', 200.00, NULL, NULL, '2026-08-01', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111114', 'TEST-MNT-004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', NULL,
    'dddddddd-dddd-dddd-dddd-ddddddddddd3', 'ffffffff-ffff-ffff-ffff-fffffffffff3',
    'Lawn maintenance needed', 'Common areas need mowing and edging', 'Landscaping', 'normal',
    'completed', 350.00, 325.00, '2026-07-28', '2026-07-25', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111115', 'TEST-MNT-005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2', 'ffffffff-ffff-ffff-ffff-fffffffffff1',
    'Emergency water leak', 'Water coming through ceiling in bathroom', 'Plumbing', 'emergency',
    'vendor_assigned', 800.00, NULL, '2026-08-01', '2026-08-01', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111116', 'TEST-MNT-006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'cccccccc-cccc-cccc-cccc-cccccccccccb',
    'dddddddd-dddd-dddd-dddd-ddddddddddd4', 'ffffffff-ffff-ffff-ffff-fffffffffff4',
    'Electrical outlet not working', 'Living room outlet has no power', 'Electrical', 'normal',
    'new', 125.00, NULL, NULL, '2026-07-30', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111117', 'TEST-MNT-007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'cccccccc-cccc-cccc-cccc-ccccccccccc7',
    'dddddddd-dddd-dddd-dddd-ddddddddddd6', 'ffffffff-ffff-ffff-ffff-fffffffffff5',
    'Front door lock jammed', 'Lock is difficult to turn and may need replacement', 'Locksmith', 'urgent',
    'scheduled', 180.00, NULL, '2026-08-03', '2026-08-01', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-111111111118', 'TEST-MNT-008', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NULL,
    'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'ffffffff-ffff-ffff-ffff-fffffffffff6',
    'Roof leak in common area', 'Water stains on ceiling in hallway', 'Roofing', 'high',
    'in_progress', 2500.00, NULL, '2026-08-10', '2026-07-28', NOW(), NOW()
);

-- ============================================
-- TEST INSPECTIONS (5+)
-- ============================================

INSERT INTO inspections (
    id, inspection_id, property_id, unit_id, inspection_type, status, scheduled_date, completed_date,
    inspector_id, inspector_vendor_id, findings, recommendations, overall_rating, follow_up_required, created_at, updated_at
) VALUES
(
    '22222222-2222-2222-2222-222222222221', 'TEST-INSP-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NULL,
    'annual', 'scheduled', '2026-08-15', NULL,
    NULL, 'ffffffff-ffff-ffff-ffff-fffffffffff4', NULL, NULL, NULL, false, NOW(), NOW()
),
(
    '22222222-2222-2222-2222-222222222222', 'TEST-INSP-002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NULL,
    'fire_safety', 'completed', '2026-07-01', '2026-07-01',
    NULL, 'ffffffff-ffff-ffff-ffff-fffffffffff4', 'All systems operational', 'Schedule annual check', 'pass', false, NOW(), NOW()
),
(
    '22222222-2222-2222-2222-222222222223', 'TEST-INSP-003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', NULL,
    'annual', 'overdue', '2026-06-01', NULL,
    NULL, NULL, NULL, NULL, NULL, true, NOW(), NOW()
),
(
    '22222222-2222-2222-2222-222222222224', 'TEST-INSP-004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', NULL,
    'hvac', 'completed', '2026-07-15', '2026-07-15',
    NULL, 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'Filters need replacement', 'Replace filters quarterly', 'conditional', true, NOW(), NOW()
),
(
    '22222222-2222-2222-2222-222222222225', 'TEST-INSP-005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'cccccccc-cccc-cccc-cccc-cccccccccccb',
    'move_in', 'completed', '2026-07-20', '2026-07-20',
    NULL, NULL, 'Unit in good condition', 'Document existing wear', 'pass', false, NOW(), NOW()
),
(
    '22222222-2222-2222-2222-222222222226', 'TEST-INSP-006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NULL,
    'elevator', 'scheduled', '2026-08-20', NULL,
    NULL, 'ffffffff-ffff-ffff-ffff-fffffffffff4', NULL, NULL, NULL, false, NOW(), NOW()
);

-- ============================================
-- TEST DOCUMENTS (6+)
-- ============================================

INSERT INTO documents (
    id, document_id, title, file_name, file_path, document_type, category, status,
    issue_date, expiry_date, association_id, property_id, unit_id, is_confidential, requires_acknowledgment, uploaded_by, created_at
) VALUES
(
    '33333333-3333-3333-3333-333333333331', 'TEST-DOC-001', 'Insurance Certificate 2026', 'insurance_cert_2026.pdf', '/docs/insurance_cert_2026.pdf',
    'insurance', 'Insurance', 'active', '2026-01-01', '2027-01-01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL, NULL,
    false, false, '00000000-0000-0000-0000-000000000000', NOW()
),
(
    '33333333-3333-3333-3333-333333333332', 'TEST-DOC-002', 'Annual Budget 2026', 'budget_2026.xlsx', '/docs/budget_2026.xlsx',
    'financial', 'Financial', 'active', '2026-01-15', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL, NULL,
    false, false, '00000000-0000-0000-0000-000000000000', NOW()
),
(
    '33333333-3333-3333-3333-333333333333', 'TEST-DOC-003', 'Fire Safety Inspection Report', 'fire_inspection_2026.pdf', '/docs/fire_inspection_2026.pdf',
    'inspection_report', 'Safety', 'active', '2026-07-01', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NULL,
    false, true, '00000000-0000-0000-0000-000000000000', NOW()
),
(
    '33333333-3333-3333-3333-333333333334', 'TEST-DOC-004', 'Elevator Maintenance Contract', 'elevator_contract.pdf', '/docs/elevator_contract.pdf',
    'contract', 'Contracts', 'active', '2026-01-01', '2026-12-31', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL, NULL,
    false, false, '00000000-0000-0000-0000-000000000000', NOW()
),
(
    '33333333-3333-3333-3333-333333333335', 'TEST-DOC-005', 'Pool Safety Certificate', 'pool_cert_2026.pdf', '/docs/pool_cert_2026.pdf',
    'certificate', 'Safety', 'active', '2026-05-01', '2026-08-15', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', NULL,
    false, false, '00000000-0000-0000-0000-000000000000', NOW()
),
(
    '33333333-3333-3333-3333-333333333336', 'TEST-DOC-006', 'Board Meeting Minutes - July', 'minutes_july_2026.pdf', '/docs/minutes_july_2026.pdf',
    'meeting_minutes', 'Governance', 'active', '2026-07-15', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL, NULL,
    true, false, '00000000-0000-0000-0000-000000000000', NOW()
);

-- ============================================
-- TEST COMPLIANCE MATTERS (5+)
-- ============================================

INSERT INTO compliance_matters (
    id, matter_id, association_id, property_id, unit_id, title, description, category, priority, status,
    identified_date, due_date, resolved_date, fine_amount, assigned_to, resolution_notes, created_at, updated_at
) VALUES
(
    '44444444-4444-4444-4444-444444444441', 'TEST-COMP-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NULL,
    'Annual Fire Inspection', 'Required annual fire safety inspection for common areas', 'fire_safety', 'high', 'open',
    '2026-07-01', '2026-08-15', NULL, NULL, 'dddddddd-dddd-dddd-dddd-ddddddddddd1', NULL, NOW(), NOW()
),
(
    '44444444-4444-4444-4444-444444444442', 'TEST-COMP-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL, NULL,
    'Elevator Certification Renewal', 'Annual elevator safety certification needs renewal', 'elevator', 'critical', 'open',
    '2026-07-15', '2026-09-01', NULL, 500.00, 'dddddddd-dddd-dddd-dddd-ddddddddddd2', NULL, NOW(), NOW()
),
(
    '44444444-4444-4444-4444-444444444443', 'TEST-COMP-003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', NULL,
    'Pool Safety Compliance', 'Pool fence and safety equipment inspection', 'safety', 'medium', 'resolved',
    '2026-06-01', '2026-06-30', '2026-06-28', NULL, 'dddddddd-dddd-dddd-dddd-ddddddddddd3', 'All requirements met', NOW(), NOW()
),
(
    '44444444-4444-4444-4444-444444444444', 'TEST-COMP-004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NULL,
    'Accessibility Ramp Update', 'ADA compliance review for entrance ramps', 'accessibility', 'high', 'open',
    '2026-07-20', '2026-10-01', NULL, NULL, 'dddddddd-dddd-dddd-dddd-ddddddddddda', NULL, NOW(), NOW()
),
(
    '44444444-4444-4444-4444-444444444445', 'TEST-COMP-005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', NULL,
    'Hazardous Materials Disclosure', 'Required environmental disclosure filing', 'environmental', 'medium', 'open',
    '2026-07-25', '2026-09-15', NULL, 250.00, 'dddddddd-dddd-dddd-dddd-ddddddddddd7', NULL, NOW(), NOW()
);

-- ============================================
-- TEST APPROVALS (4+)
-- ============================================

INSERT INTO approvals (
    id, approval_id, association_id, title, description, approval_type, requested_amount, status,
    requested_by, requested_at, approved_by, approved_at, related_maintenance_request_id, related_vendor_id, created_at, updated_at
) VALUES
(
    '55555555-5555-5555-5555-555555555551', 'TEST-APPR-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'HVAC System Replacement', 'Replace aging HVAC system in common areas', 'capital_improvement', 15000.00,
    'pending', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', NOW(), NULL, NULL, NULL, NULL, NOW(), NOW()
),
(
    '55555555-5555-5555-5555-555555555552', 'TEST-APPR-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Landscaping Contract 2026-2027', 'Annual landscaping maintenance contract renewal', 'vendor_contract', 8500.00,
    'approved', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', NOW() - INTERVAL '7 days', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', NOW() - INTERVAL '5 days', NULL, 'ffffffff-ffff-ffff-ffff-fffffffffff3', NOW(), NOW()
),
(
    '55555555-5555-5555-5555-555555555553', 'TEST-APPR-003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Emergency Roof Repair', 'Urgent repair for hallway leak', 'maintenance', 3200.00,
    'pending', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', NOW(), NULL, NULL, '11111111-1111-1111-1111-111111111118', 'ffffffff-ffff-ffff-ffff-fffffffffff6', NOW(), NOW()
),
(
    '55555555-5555-5555-5555-555555555554', 'TEST-APPR-004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Pool Furniture Replacement', 'Replace worn pool chairs and tables', 'capital_improvement', 4500.00,
    'pending', 'dddddddd-dddd-dddd-dddd-ddddddddddd6', NOW(), NULL, NULL, NULL, NULL, NOW(), NOW()
);

-- ============================================
-- TEST COMMUNICATIONS (5+)
-- ============================================

INSERT INTO communications (
    id, communication_id, association_id, property_id, subject, content, type, send_to_all, status,
    scheduled_send_at, sent_at, created_by, created_at, updated_at
) VALUES
(
    '66666666-6666-6666-6666-666666666661', 'TEST-COMM-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL,
    'Pool Maintenance Schedule', 'The pool will be closed for maintenance on August 10-12.', 'announcement', true, 'sent',
    NULL, NOW() - INTERVAL '2 days', 'dddddddd-dddd-dddd-dddd-ddddddddddda', NOW(), NOW()
),
(
    '66666666-6666-6666-6666-666666666662', 'TEST-COMM-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL,
    'Annual Meeting Notice', 'Annual meeting scheduled for May 15, 2026 at 7:00 PM', 'notice', true, 'sent',
    NULL, NOW() - INTERVAL '5 days', 'dddddddd-dddd-dddd-dddd-ddddddddddda', NOW(), NOW()
),
(
    '66666666-6666-6666-6666-666666666663', 'TEST-COMM-003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL,
    'Reminder: Assessment Due', 'Quarterly assessment payment is due by August 15', 'reminder', true, 'draft',
    '2026-08-10 09:00:00', NULL, 'dddddddd-dddd-dddd-dddd-ddddddddddda', NOW(), NOW()
),
(
    '66666666-6666-6666-6666-666666666664', 'TEST-COMM-004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NULL,
    'Parking Lot Resurfacing', 'Parking lot will be closed for resurfacing on August 20-22', 'notice', true, 'scheduled',
    '2026-08-15 10:00:00', NULL, 'dddddddd-dddd-dddd-dddd-ddddddddddd6', NOW(), NOW()
),
(
    '66666666-6666-6666-6666-666666666665', 'TEST-COMM-005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Unit 3S Water Shutoff', 'Emergency water shutoff scheduled for repairs', 'urgent_notice', false, 'sent',
    NULL, NOW() - INTERVAL '1 day', 'dddddddd-dddd-dddd-dddd-ddddddddddda', NOW(), NOW()
);

-- ============================================
-- TEST PAYMENT RECORDS (4+)
-- ============================================

INSERT INTO payment_records (
    id, payment_id, association_id, contact_id, payment_type, amount, processor, processor_payment_id, status,
    invoice_number, description, initiated_at, completed_at, created_at
) VALUES
(
    '77777777-7777-7777-7777-777777777771', 'TEST-PAY-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'assessment', 350.00, 'stripe', 'pi_1234567890', 'completed',
    'INV-2026-001', 'Q3 2026 Assessment', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW()
),
(
    '77777777-7777-7777-7777-777777777772', 'TEST-PAY-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'assessment', 350.00, 'stripe', 'pi_1234567891', 'completed',
    'INV-2026-002', 'Q3 2026 Assessment', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW()
),
(
    '77777777-7777-7777-7777-777777777773', 'TEST-PAY-003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    'late_fee', 25.00, 'paypal', 'PAYPAL-12345', 'pending',
    'INV-2026-003', 'Late fee for July assessment', NOW(), NULL, NOW()
),
(
    '77777777-7777-7777-7777-777777777774', 'TEST-PAY-004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'dddddddd-dddd-dddd-dddd-ddddddddddd3',
    'special_assessment', 500.00, 'stripe', NULL, 'failed',
    'INV-2026-004', 'Road repair special assessment', NOW() - INTERVAL '1 day', NULL, NOW()
);

-- ============================================
-- TEST APPOINTMENTS (4+)
-- ============================================

INSERT INTO appointments (
    id, appointment_id, association_id, property_id, unit_id, title, description, appointment_type,
    start_time, end_time, is_virtual, virtual_link, location, organizer_id, status, created_at, updated_at
) VALUES
(
    '88888888-8888-8888-8888-888888888881', 'TEST-APT-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NULL,
    'Annual Inspection - Ridgeland', 'Full property inspection', 'inspection', '2026-08-15 09:00:00', '2026-08-15 12:00:00',
    false, NULL, '6722 S Ridgeland Ave', 'dddddddd-dddd-dddd-dddd-ddddddddddda', 'scheduled', NOW(), NOW()
),
(
    '88888888-8888-8888-8888-888888888882', 'TEST-APT-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL, NULL,
    'Board Meeting - August', 'Monthly board meeting', 'meeting', '2026-08-10 19:00:00', '2026-08-10 21:00:00',
    false, NULL, 'Community Room', 'dddddddd-dddd-dddd-dddd-ddddddddddda', 'scheduled', NOW(), NOW()
),
(
    '88888888-8888-8888-8888-888888888883', 'TEST-APT-003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'cccccccc-cccc-cccc-cccc-ccccccccccc7',
    'Move-in Inspection', 'Pre-move-in condition inspection', 'inspection', '2026-08-05 10:00:00', '2026-08-05 11:00:00',
    false, NULL, '101 Oakwood Townhomes', 'dddddddd-dddd-dddd-dddd-ddddddddddd6', 'scheduled', NOW(), NOW()
),
(
    '88888888-8888-8888-8888-888888888884', 'TEST-APT-004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'HVAC Service Call', 'Follow-up on AC repair', 'maintenance', '2026-08-03 14:00:00', '2026-08-03 16:00:00',
    false, NULL, 'Unit 2N, 6722 S Ridgeland', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', 'scheduled', NOW(), NOW()
),
(
    '88888888-8888-8888-8888-888888888885', 'TEST-APT-005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NULL, NULL,
    'Virtual Board Orientation', 'New board member orientation session', 'meeting', '2026-08-12 18:00:00', '2026-08-12 19:00:00',
    true, 'https://meet.example.com/board-orientation', NULL, 'dddddddd-dddd-dddd-dddd-ddddddddddd7', 'scheduled', NOW(), NOW()
);

-- ============================================
-- SEED COMPLETE
-- ============================================

SELECT 'Seed data inserted successfully!' as result;