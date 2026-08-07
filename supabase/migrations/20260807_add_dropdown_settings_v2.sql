-- Add dropdown settings for all record types
-- Column names are: value, label (not option_value, option_label)

-- Vendor Categories
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_active)
VALUES
    ('Vendor', 'Category', 'HVAC', 'HVAC', 1, true),
    ('Vendor', 'Category', 'Plumbing', 'Plumbing', 2, true),
    ('Vendor', 'Category', 'Electrical', 'Electrical', 3, true),
    ('Vendor', 'Category', 'Landscaping', 'Landscaping', 4, true),
    ('Vendor', 'Category', 'Cleaning', 'Cleaning', 5, true),
    ('Vendor', 'Category', 'Security', 'Security', 6, true),
    ('Vendor', 'Category', 'Construction', 'Construction', 7, true),
    ('Vendor', 'Category', 'Roofing', 'Roofing', 8, true),
    ('Vendor', 'Category', 'Painting', 'Painting', 9, true),
    ('Vendor', 'Category', 'Pest Control', 'Pest Control', 10, true),
    ('Vendor', 'Category', 'Snow Removal', 'Snow Removal', 11, true),
    ('Vendor', 'Category', 'General Maintenance', 'General Maintenance', 12, true),
    ('Vendor', 'Category', 'Other', 'Other', 13, true)
ON CONFLICT (record_type, field_name, value) DO NOTHING;

-- Vendor Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_active)
VALUES
    ('Vendor', 'Status', 'active', 'Active', 1, true),
    ('Vendor', 'Status', 'inactive', 'Inactive', 2, true),
    ('Vendor', 'Status', 'pending', 'Pending Approval', 3, true),
    ('Vendor', 'Status', 'suspended', 'Suspended', 4, true)
ON CONFLICT (record_type, field_name, value) DO NOTHING;

-- Compliance Categories
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_active)
VALUES
    ('Compliance Matter', 'category', 'violation', 'Violation', 1, true),
    ('Compliance Matter', 'category', 'delinquency', 'Delinquency', 2, true),
    ('Compliance Matter', 'category', 'insurance', 'Insurance Issue', 3, true),
    ('Compliance Matter', 'category', 'permit', 'Permit Issue', 4, true),
    ('Compliance Matter', 'category', 'safety', 'Safety Concern', 5, true),
    ('Compliance Matter', 'category', 'maintenance', 'Maintenance Required', 6, true),
    ('Compliance Matter', 'category', 'accessibility', 'Accessibility', 7, true),
    ('Compliance Matter', 'category', 'environmental', 'Environmental', 8, true),
    ('Compliance Matter', 'category', 'zoning', 'Zoning', 9, true),
    ('Compliance Matter', 'category', 'financial', 'Financial Reporting', 10, true),
    ('Compliance Matter', 'category', 'other', 'Other', 11, true)
ON CONFLICT (record_type, field_name, value) DO NOTHING;

-- Compliance Priority
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_active)
VALUES
    ('Compliance Matter', 'priority', 'low', 'Low', 1, true),
    ('Compliance Matter', 'priority', 'medium', 'Medium', 2, true),
    ('Compliance Matter', 'priority', 'high', 'High', 3, true),
    ('Compliance Matter', 'priority', 'critical', 'Critical', 4, true)
ON CONFLICT (record_type, field_name, value) DO NOTHING;

-- Compliance Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_active)
VALUES
    ('Compliance Matter', 'status', 'open', 'Open', 1, true),
    ('Compliance Matter', 'status', 'in_progress', 'In Progress', 2, true),
    ('Compliance Matter', 'status', 'resolved', 'Resolved', 3, true),
    ('Compliance Matter', 'status', 'closed', 'Closed', 4, true)
ON CONFLICT (record_type, field_name, value) DO NOTHING;

-- Inspection Types
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_active)
VALUES
    ('Inspection', 'Inspection Type', 'move_in', 'Move In', 1, true),
    ('Inspection', 'Inspection Type', 'move_out', 'Move Out', 2, true),
    ('Inspection', 'Inspection Type', 'annual', 'Annual', 3, true),
    ('Inspection', 'Inspection Type', 'quarterly', 'Quarterly', 4, true),
    ('Inspection', 'Inspection Type', 'safety', 'Safety', 5, true),
    ('Inspection', 'Inspection Type', 'maintenance', 'Maintenance', 6, true),
    ('Inspection', 'Inspection Type', 'insurance', 'Insurance', 7, true),
    ('Inspection', 'Inspection Type', 'pre_lease', 'Pre-Lease', 8, true),
    ('Inspection', 'Inspection Type', 'other', 'Other', 9, true)
ON CONFLICT (record_type, field_name, value) DO NOTHING;

-- Inspection Status
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_active)
VALUES
    ('Inspection', 'Inspection Status', 'scheduled', 'Scheduled', 1, true),
    ('Inspection', 'Inspection Status', 'in_progress', 'In Progress', 2, true),
    ('Inspection', 'Inspection Status', 'completed', 'Completed', 3, true),
    ('Inspection', 'Inspection Status', 'cancelled', 'Cancelled', 4, true)
ON CONFLICT (record_type, field_name, value) DO NOTHING;

-- Maintenance Request Categories
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_active)
VALUES
    ('Maintenance Request', 'Category', 'HVAC', 'HVAC', 1, true),
    ('Maintenance Request', 'Category', 'Plumbing', 'Plumbing', 2, true),
    ('Maintenance Request', 'Category', 'Electrical', 'Electrical', 3, true),
    ('Maintenance Request', 'Category', 'Appliance', 'Appliance', 4, true),
    ('Maintenance Request', 'Category', 'Structural', 'Structural', 5, true),
    ('Maintenance Request', 'Category', 'Cosmetic', 'Cosmetic', 6, true),
    ('Maintenance Request', 'Category', 'Safety', 'Safety', 7, true),
    ('Maintenance Request', 'Category', 'Cleaning', 'Cleaning', 8, true),
    ('Maintenance Request', 'Category', 'Landscaping', 'Landscaping', 9, true),
    ('Maintenance Request', 'Category', 'Other', 'Other', 10, true)
ON CONFLICT (record_type, field_name, value) DO NOTHING;

-- Maintenance Request Urgency
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_active)
VALUES
    ('Maintenance Request', 'Urgency', 'emergency', 'Emergency', 1, true),
    ('Maintenance Request', 'Urgency', 'urgent', 'Urgent', 2, true),
    ('Maintenance Request', 'Urgency', 'normal', 'Normal', 3, true),
    ('Maintenance Request', 'Urgency', 'low', 'Low', 4, true)
ON CONFLICT (record_type, field_name, value) DO NOTHING;

-- Approval Types
INSERT INTO dropdown_settings (record_type, field_name, value, label, sort_order, is_active)
VALUES
    ('Approval', 'approvalType', 'maintenance', 'Maintenance', 1, true),
    ('Approval', 'approvalType', 'capital_improvement', 'Capital Improvement', 2, true),
    ('Approval', 'approvalType', 'vendor_contract', 'Vendor Contract', 3, true),
    ('Approval', 'approvalType', 'budget_item', 'Budget Item', 4, true),
    ('Approval', 'approvalType', 'policy_change', 'Policy Change', 5, true),
    ('Approval', 'approvalType', 'assessment', 'Assessment', 6, true),
    ('Approval', 'approvalType', 'other', 'Other', 7, true)
ON CONFLICT (record_type, field_name, value) DO NOTHING;
