-- Tenant Seed: Dropdown Settings
-- Seeds default dropdown values for a new tenant
-- Can be run automatically on tenant creation or manually via Platform Admin

-- Usage: Pass tenant_id as a parameter or set it before running
-- For psql: \set tenant_id 'your-tenant-uuid'
-- For Supabase: Use parameterized query with tenant_id

DO $$
DECLARE
    v_tenant_id UUID;
    v_created_by UUID;
BEGIN
    -- Try to get tenant_id from variable or use a default
    BEGIN
        v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_tenant_id := NULL;
    END;
    
    -- If no tenant_id set, raise error
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'tenant_id must be set. Use: SET app.current_tenant_id = ''your-uuid'';';
    END IF;

    -- Association Company - Association Status
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Association Company', 'Association Status', 'prospect', 'Prospect', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Association Company', 'Association Status', 'onboarding', 'Onboarding', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Association Company', 'Association Status', 'active', 'Active', 3, true, true, NOW(), NOW()),
    (v_tenant_id, 'Association Company', 'Association Status', 'on_hold', 'On-Hold', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Association Company', 'Association Status', 'ending_management', 'Ending Management', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Association Company', 'Association Status', 'inactive', 'Inactive', 6, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Association Company - Association Type
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Association Company', 'Association Type', 'condominium', 'Condominium', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Association Company', 'Association Type', 'hoa', 'HOA (Homeowners Association)', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Association Company', 'Association Type', 'cooperative', 'Cooperative', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Association Company', 'Association Type', 'commercial', 'Commercial', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Association Company', 'Association Type', 'mixed_use', 'Mixed Use', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Association Company', 'Association Type', 'other', 'Other', 6, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Contact - Role
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Contact', 'role', 'admin_user', 'Admin User', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'association_manager', 'Association Manager', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'board_member', 'Board Member', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'finance_user', 'Finance User', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'owner', 'Owner', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'portfolio_manager', 'Portfolio Manager', 6, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'resident', 'Resident', 7, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'staff', 'Staff', 8, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'vendor_contractor', 'Vendor Contractor', 9, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'property_manager', 'Property Manager', 10, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'emergency_contact', 'Emergency Contact', 11, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'inspector', 'Inspector', 12, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'co_owner', 'Co-Owner', 13, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'maintenance_contact', 'Maintenance Contact', 14, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'role', 'other', 'Other', 15, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Contact - Status
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Contact', 'status', 'active', 'Active', 1, true, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'status', 'inactive', 'Inactive', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'status', 'pending', 'Pending', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'status', 'suspended', 'Suspended', 4, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Contact - Board Position
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Contact', 'board_position', 'president', 'President', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'board_position', 'vice_president', 'Vice President', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'board_position', 'treasurer', 'Treasurer', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'board_position', 'secretary', 'Secretary', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'board_position', 'member', 'Member', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Contact', 'board_position', 'none', 'None', 6, true, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Property - Type
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Property', 'type', 'condominium', 'Condominium', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Property', 'type', 'apartment', 'Apartment', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Property', 'type', 'townhouse', 'Townhouse', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Property', 'type', 'single_family', 'Single Family', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Property', 'type', 'commercial', 'Commercial', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Property', 'type', 'mixed_use', 'Mixed Use', 6, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Property - Status
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Property', 'status', 'active', 'Active', 1, true, true, NOW(), NOW()),
    (v_tenant_id, 'Property', 'status', 'inactive', 'Inactive', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Property', 'status', 'under_construction', 'Under Construction', 3, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Unit - Type
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Unit', 'type', 'studio', 'Studio', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Unit', 'type', '1_bedroom', '1 Bedroom', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Unit', 'type', '2_bedroom', '2 Bedroom', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Unit', 'type', '3_bedroom', '3 Bedroom', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Unit', 'type', '4_bedroom', '4+ Bedroom', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Unit', 'type', 'penthouse', 'Penthouse', 6, false, true, NOW(), NOW()),
    (v_tenant_id, 'Unit', 'type', 'loft', 'Loft', 7, false, true, NOW(), NOW()),
    (v_tenant_id, 'Unit', 'type', 'townhouse', 'Townhouse', 8, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Unit - Status
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Unit', 'status', 'active', 'Active', 1, true, true, NOW(), NOW()),
    (v_tenant_id, 'Unit', 'status', 'inactive', 'Inactive', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Unit', 'status', 'under_renovation', 'Under Renovation', 3, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Vendor - Type
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Vendor', 'type', 'plumbing', 'Plumbing', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'type', 'electrical', 'Electrical', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'type', 'hvac', 'HVAC', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'type', 'landscaping', 'Landscaping', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'type', 'cleaning', 'Cleaning', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'type', 'security', 'Security', 6, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'type', 'general_contractor', 'General Contractor', 7, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'type', 'painting', 'Painting', 8, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'type', 'roofing', 'Roofing', 9, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'type', 'pest_control', 'Pest Control', 10, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'type', 'other', 'Other', 11, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Vendor - Status
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Vendor', 'status', 'active', 'Active', 1, true, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'status', 'inactive', 'Inactive', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Vendor', 'status', 'pending', 'Pending Approval', 3, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Maintenance Request - Category
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Maintenance Request', 'category', 'plumbing', 'Plumbing', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'category', 'electrical', 'Electrical', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'category', 'hvac', 'HVAC', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'category', 'appliance', 'Appliance', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'category', 'structural', 'Structural', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'category', 'landscaping', 'Landscaping', 6, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'category', 'cleaning', 'Cleaning', 7, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'category', 'security', 'Security', 8, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'category', 'other', 'Other', 9, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Maintenance Request - Priority
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Maintenance Request', 'priority', 'low', 'Low', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'priority', 'medium', 'Medium', 2, true, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'priority', 'high', 'High', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'priority', 'emergency', 'Emergency', 4, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Maintenance Request - Status
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Maintenance Request', 'status', 'open', 'Open', 1, true, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'status', 'assigned', 'Assigned', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'status', 'in_progress', 'In Progress', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'status', 'on_hold', 'On Hold', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'status', 'completed', 'Completed', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Maintenance Request', 'status', 'cancelled', 'Cancelled', 6, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Inspection - Type
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Inspection', 'type', 'routine', 'Routine', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Inspection', 'type', 'move_in', 'Move In', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Inspection', 'type', 'move_out', 'Move Out', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Inspection', 'type', 'annual', 'Annual', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Inspection', 'type', 'fire_safety', 'Fire Safety', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Inspection', 'type', 'hvac', 'HVAC', 6, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Inspection - Status
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Inspection', 'status', 'scheduled', 'Scheduled', 1, true, true, NOW(), NOW()),
    (v_tenant_id, 'Inspection', 'status', 'in_progress', 'In Progress', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Inspection', 'status', 'completed', 'Completed', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Inspection', 'status', 'overdue', 'Overdue', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Inspection', 'status', 'cancelled', 'Cancelled', 5, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Document - Type
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Document', 'type', 'insurance', 'Insurance', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Document', 'type', 'financial', 'Financial', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Document', 'type', 'legal', 'Legal', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Document', 'type', 'meeting_minutes', 'Meeting Minutes', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Document', 'type', 'contract', 'Contract', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Document', 'type', 'inspection_report', 'Inspection Report', 6, false, true, NOW(), NOW()),
    (v_tenant_id, 'Document', 'type', 'certificate', 'Certificate', 7, false, true, NOW(), NOW()),
    (v_tenant_id, 'Document', 'type', 'policy', 'Policy', 8, false, true, NOW(), NOW()),
    (v_tenant_id, 'Document', 'type', 'notice', 'Notice', 9, false, true, NOW(), NOW()),
    (v_tenant_id, 'Document', 'type', 'other', 'Other', 10, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Approval - Type
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Approval', 'type', 'maintenance', 'Maintenance', 1, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'type', 'capital_improvement', 'Capital Improvement', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'type', 'vendor_contract', 'Vendor Contract', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'type', 'budget_item', 'Budget Item', 4, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'type', 'policy_change', 'Policy Change', 5, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'type', 'special_assessment', 'Special Assessment', 6, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'type', 'vendor_selection', 'Vendor Selection', 7, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'type', 'contract_approval', 'Contract Approval', 8, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'type', 'capital_expense', 'Capital Expense', 9, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'type', 'other', 'Other', 10, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    -- Approval - Status
    INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_default, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'Approval', 'status', 'pending', 'Pending', 1, true, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'status', 'approved', 'Approved', 2, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'status', 'rejected', 'Rejected', 3, false, true, NOW(), NOW()),
    (v_tenant_id, 'Approval', 'status', 'cancelled', 'Cancelled', 4, false, true, NOW(), NOW())
    ON CONFLICT (tenant_id, record_type, field_name, value) DO NOTHING;

    RAISE NOTICE 'Dropdown settings seeded successfully for tenant: %', v_tenant_id;
END $$;
