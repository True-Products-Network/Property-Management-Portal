-- Dropdown Settings Table
-- Stores configurable dropdown values for all record types

CREATE TABLE dropdown_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_type TEXT NOT NULL,
    field_name TEXT NOT NULL,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES portal_users(id),
    updated_by UUID REFERENCES portal_users(id),
    UNIQUE(record_type, field_name, value)
);

-- Create index for faster lookups
CREATE INDEX idx_dropdown_settings_lookup ON dropdown_settings(record_type, field_name, is_active);
CREATE INDEX idx_dropdown_settings_sort ON dropdown_settings(record_type, field_name, sort_order);

-- Enable RLS
ALTER TABLE dropdown_settings ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check admin status
-- Uses auth.users metadata directly to avoid RLS recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin_flag BOOLEAN;
BEGIN
    -- Check raw auth.users metadata (bypasses RLS)
    SELECT COALESCE(
        (raw_user_meta_data->>'is_admin')::boolean,
        false
    ) INTO is_admin_flag
    FROM auth.users
    WHERE id = user_id;
    
    RETURN COALESCE(is_admin_flag, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only admins can manage dropdown settings
CREATE POLICY "Admins can manage dropdown settings" ON dropdown_settings
    FOR ALL USING (is_admin_user(auth.uid()));

-- All authenticated users can read active dropdowns
CREATE POLICY "Users can read active dropdowns" ON dropdown_settings
    FOR SELECT USING (is_active = true);

-- Insert default dropdown values

-- Association Company - Association Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Association Company', 'Association Status', 'prospect', 'Prospect', 1, false),
('Association Company', 'Association Status', 'onboarding', 'Onboarding', 2, false),
('Association Company', 'Association Status', 'active', 'Active', 3, true),
('Association Company', 'Association Status', 'on_hold', 'On-Hold', 4, false),
('Association Company', 'Association Status', 'ending_management', 'Ending Management', 5, false),
('Association Company', 'Association Status', 'inactive', 'Inactive', 6, false);

-- Association Company - Association Type
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Association Company', 'Association Type', 'condominium', 'Condominium', 1, false),
('Association Company', 'Association Type', 'hoa', 'HOA (Homeowners Association)', 2, false),
('Association Company', 'Association Type', 'cooperative', 'Cooperative', 3, false),
('Association Company', 'Association Type', 'commercial', 'Commercial', 4, false),
('Association Company', 'Association Type', 'mixed_use', 'Mixed Use', 5, false),
('Association Company', 'Association Type', 'other', 'Other', 6, false);

-- People - Contact Role(s)
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('People', 'Contact Role(s)', 'owner', 'Owner', 1, false),
('People', 'Contact Role(s)', 'co_owner', 'Co-Owner', 2, false),
('People', 'Contact Role(s)', 'tenant', 'Tenant', 3, false),
('People', 'Contact Role(s)', 'occupant', 'Occupant', 4, false),
('People', 'Contact Role(s)', 'board_president', 'Board President', 5, false),
('People', 'Contact Role(s)', 'board_treasurer', 'Board Treasurer', 6, false),
('People', 'Contact Role(s)', 'board_secretary', 'Board Secretary', 7, false),
('People', 'Contact Role(s)', 'board_member', 'Board Member', 8, false),
('People', 'Contact Role(s)', 'property_manager', 'Property Manager', 9, false),
('People', 'Contact Role(s)', 'assistant_manager', 'Assistant Manager', 10, false),
('People', 'Contact Role(s)', 'maintenance_staff', 'Maintenance Staff', 11, false),
('People', 'Contact Role(s)', 'vendor_contact', 'Vendor Contact', 12, false),
('People', 'Contact Role(s)', 'emergency_contact', 'Emergency Contact', 13, false),
('People', 'Contact Role(s)', 'other', 'Other', 14, false);

-- People - Board Position
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('People', 'Board Position', 'president', 'President', 1, false),
('People', 'Board Position', 'vice_president', 'Vice President', 2, false),
('People', 'Board Position', 'treasurer', 'Treasurer', 3, false),
('People', 'Board Position', 'secretary', 'Secretary', 4, false),
('People', 'Board Position', 'member_at_large', 'Member at Large', 5, false),
('People', 'Board Position', 'committee_chair', 'Committee Chair', 6, false);

-- People - Preferred Contact Method
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('People', 'Preferred Contact Method', 'email', 'Email', 1, true),
('People', 'Preferred Contact Method', 'phone', 'Phone', 2, false),
('People', 'Preferred Contact Method', 'sms', 'SMS/Text', 3, false),
('People', 'Preferred Contact Method', 'mail', 'Mail', 4, false);

-- Vendor Company - Vendor Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Vendor Company', 'Vendor Status', 'active', 'Active', 1, true),
('Vendor Company', 'Vendor Status', 'inactive', 'Inactive', 2, false),
('Vendor Company', 'Vendor Status', 'pending_approval', 'Pending Approval', 3, false),
('Vendor Company', 'Vendor Status', 'suspended', 'Suspended', 4, false);

-- Vendor Company - Vendor Type
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Vendor Company', 'Vendor Type', 'hvac', 'HVAC', 1, false),
('Vendor Company', 'Vendor Type', 'plumbing', 'Plumbing', 2, false),
('Vendor Company', 'Vendor Type', 'electrical', 'Electrical', 3, false),
('Vendor Company', 'Vendor Type', 'landscaping', 'Landscaping', 4, false),
('Vendor Company', 'Vendor Type', 'cleaning', 'Cleaning', 5, false),
('Vendor Company', 'Vendor Type', 'security', 'Security', 6, false),
('Vendor Company', 'Vendor Type', 'pest_control', 'Pest Control', 7, false),
('Vendor Company', 'Vendor Type', 'roofing', 'Roofing', 8, false),
('Vendor Company', 'Vendor Type', 'painting', 'Painting', 9, false),
('Vendor Company', 'Vendor Type', 'general_contracting', 'General Contracting', 10, false),
('Vendor Company', 'Vendor Type', 'elevator', 'Elevator', 11, false),
('Vendor Company', 'Vendor Type', 'fire_safety', 'Fire Safety', 12, false),
('Vendor Company', 'Vendor Type', 'pool_service', 'Pool Service', 13, false),
('Vendor Company', 'Vendor Type', 'snow_removal', 'Snow Removal', 14, false),
('Vendor Company', 'Vendor Type', 'other', 'Other', 15, false);

-- Property - Property Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Property', 'Property Status', 'active', 'Active', 1, true),
('Property', 'Property Status', 'inactive', 'Inactive', 2, false),
('Property', 'Property Status', 'under_construction', 'Under Construction', 3, false),
('Property', 'Property Status', 'pending_sale', 'Pending Sale', 4, false);

-- Property - Property Type
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Property', 'Property Type', 'condominium', 'Condominium', 1, false),
('Property', 'Property Type', 'apartment', 'Apartment', 2, false),
('Property', 'Property Type', 'townhouse', 'Townhouse', 3, false),
('Property', 'Property Type', 'single_family', 'Single Family', 4, false),
('Property', 'Property Type', 'commercial', 'Commercial', 5, false),
('Property', 'Property Type', 'mixed_use', 'Mixed Use', 6, false);

-- Unit - Occupancy Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Unit', 'Occupancy Status', 'owner_occupied', 'Owner Occupied', 1, false),
('Unit', 'Occupancy Status', 'tenant_occupied', 'Tenant Occupied', 2, false),
('Unit', 'Occupancy Status', 'vacant', 'Vacant', 3, false);

-- Unit - Rental Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Unit', 'Rental Status', 'rented', 'Rented', 1, false),
('Unit', 'Rental Status', 'available', 'Available', 2, false),
('Unit', 'Rental Status', 'not_for_rent', 'Not For Rent', 3, false);

-- Maintenance Request - Category
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Maintenance Request', 'Category', 'hvac', 'HVAC', 1, false),
('Maintenance Request', 'Category', 'plumbing', 'Plumbing', 2, false),
('Maintenance Request', 'Category', 'electrical', 'Electrical', 3, false),
('Maintenance Request', 'Category', 'appliance', 'Appliance', 4, false),
('Maintenance Request', 'Category', 'structural', 'Structural', 5, false),
('Maintenance Request', 'Category', 'cosmetic', 'Cosmetic', 6, false),
('Maintenance Request', 'Category', 'safety', 'Safety', 7, false),
('Maintenance Request', 'Category', 'cleaning', 'Cleaning', 8, false),
('Maintenance Request', 'Category', 'landscaping', 'Landscaping', 9, false),
('Maintenance Request', 'Category', 'other', 'Other', 10, false);

-- Maintenance Request - Urgency
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Maintenance Request', 'Urgency', 'emergency', 'Emergency', 1, false),
('Maintenance Request', 'Urgency', 'urgent', 'Urgent', 2, false),
('Maintenance Request', 'Urgency', 'normal', 'Normal', 3, true),
('Maintenance Request', 'Urgency', 'low', 'Low', 4, false);

-- Maintenance Request - Current Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Maintenance Request', 'Current Status', 'new', 'New', 1, true),
('Maintenance Request', 'Current Status', 'triaged', 'Triaged', 2, false),
('Maintenance Request', 'Current Status', 'pending_approval', 'Pending Approval', 3, false),
('Maintenance Request', 'Current Status', 'approved', 'Approved', 4, false),
('Maintenance Request', 'Current Status', 'vendor_assigned', 'Vendor Assigned', 5, false),
('Maintenance Request', 'Current Status', 'scheduled', 'Scheduled', 6, false),
('Maintenance Request', 'Current Status', 'in_progress', 'In Progress', 7, false),
('Maintenance Request', 'Current Status', 'on_hold', 'On Hold', 8, false),
('Maintenance Request', 'Current Status', 'completed', 'Completed', 9, false),
('Maintenance Request', 'Current Status', 'closed', 'Closed', 10, false),
('Maintenance Request', 'Current Status', 'cancelled', 'Cancelled', 11, false);

-- Inspection - Overall Result
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Inspection', 'Overall Result', 'excellent', 'Excellent', 1, false),
('Inspection', 'Overall Result', 'good', 'Good', 2, false),
('Inspection', 'Overall Result', 'fair', 'Fair', 3, false),
('Inspection', 'Overall Result', 'poor', 'Poor', 4, false),
('Inspection', 'Overall Result', 'critical', 'Critical', 5, false);

-- Inspection - Inspection Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Inspection', 'Inspection Status', 'scheduled', 'Scheduled', 1, true),
('Inspection', 'Inspection Status', 'in_progress', 'In Progress', 2, false),
('Inspection', 'Inspection Status', 'completed', 'Completed', 3, false),
('Inspection', 'Inspection Status', 'overdue', 'Overdue', 4, false),
('Inspection', 'Inspection Status', 'cancelled', 'Cancelled', 5, false),
('Inspection', 'Inspection Status', 'rescheduled', 'Rescheduled', 6, false);

-- Document Record - Document Type
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Document Record', 'Document Type', 'insurance', 'Insurance', 1, false),
('Document Record', 'Document Type', 'financial', 'Financial', 2, false),
('Document Record', 'Document Type', 'legal', 'Legal', 3, false),
('Document Record', 'Document Type', 'meeting_minutes', 'Meeting Minutes', 4, false),
('Document Record', 'Document Type', 'contract', 'Contract', 5, false),
('Document Record', 'Document Type', 'inspection_report', 'Inspection Report', 6, false),
('Document Record', 'Document Type', 'certificate', 'Certificate', 7, false),
('Document Record', 'Document Type', 'policy', 'Policy', 8, false),
('Document Record', 'Document Type', 'notice', 'Notice', 9, false),
('Document Record', 'Document Type', 'other', 'Other', 10, false);

-- Compliance Matter - Compliance Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_default) VALUES
('Compliance Matter', 'Compliance Status', 'open', 'Open', 1, true),
('Compliance Matter', 'Compliance Status', 'notice_issued', 'Notice Issued', 2, false),
('Compliance Matter', 'Compliance Status', 'evidence_gathering', 'Evidence Gathering', 3, false),
('Compliance Matter', 'Compliance Status', 'hearing_scheduled', 'Hearing Scheduled', 4, false),
('Compliance Matter', 'Compliance Status', 'under_review', 'Under Review', 5, false),
('Compliance Matter', 'Compliance Status', 'decision_pending', 'Decision Pending', 6, false),
('Compliance Matter', 'Compliance Status', 'resolved', 'Resolved', 7, false),
('Compliance Matter', 'Compliance Status', 'closed', 'Closed', 8, false),
('Compliance Matter', 'Compliance Status', 'appealed', 'Appealed', 9, false);

SELECT 'Dropdown settings table created and populated with default values' as result;
