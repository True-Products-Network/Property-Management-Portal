-- Seed new dropdowns for Inspections and Approvals
-- Run this in Supabase SQL Editor for each tenant that needs these dropdowns

-- ============================================
-- INSPECTION DROPDOWNS
-- ============================================

-- Inspection Type
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'routine', 'Routine', 1, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'routine'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'move_in', 'Move In', 2, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'move_in'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'move_out', 'Move Out', 3, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'move_out'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'annual', 'Annual', 4, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'annual'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'fire_safety', 'Fire Safety', 5, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'fire_safety'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'elevator', 'Elevator', 6, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'elevator'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'hvac', 'HVAC', 7, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'hvac'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'roof', 'Roof', 8, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'roof'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'pool', 'Pool', 9, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'pool'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'emergency_systems', 'Emergency Systems', 10, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'emergency_systems'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'insurance', 'Insurance', 11, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'insurance'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'other', 'Other', 12, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Type' AND value = 'other'
);

-- Inspection Status
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'scheduled', 'Scheduled', 1, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Status' AND value = 'scheduled'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'in_progress', 'In Progress', 2, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Status' AND value = 'in_progress'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'completed', 'Completed', 3, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Status' AND value = 'completed'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'overdue', 'Overdue', 4, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Status' AND value = 'overdue'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'cancelled', 'Cancelled', 5, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Status' AND value = 'cancelled'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'rescheduled', 'Rescheduled', 6, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Inspection Status' AND value = 'rescheduled'
);

-- Overall Result (Rating)
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Overall Result', 'excellent', 'Excellent', 1, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Overall Result' AND value = 'excellent'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Overall Result', 'good', 'Good', 2, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Overall Result' AND value = 'good'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Overall Result', 'fair', 'Fair', 3, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Overall Result' AND value = 'fair'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Overall Result', 'poor', 'Poor', 4, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Overall Result' AND value = 'poor'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Overall Result', 'critical', 'Critical', 5, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Inspection' AND field_name = 'Overall Result' AND value = 'critical'
);

-- ============================================
-- APPROVAL DROPDOWNS
-- ============================================

-- Approval Type
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'maintenance', 'Maintenance Approval', 1, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Approval' AND field_name = 'Approval Type' AND value = 'maintenance'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'capital_improvement', 'Capital Improvement', 2, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Approval' AND field_name = 'Approval Type' AND value = 'capital_improvement'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'vendor_contract', 'Vendor Contract', 3, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Approval' AND field_name = 'Approval Type' AND value = 'vendor_contract'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'budget_item', 'Budget Item', 4, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Approval' AND field_name = 'Approval Type' AND value = 'budget_item'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'policy_change', 'Policy Change', 5, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Approval' AND field_name = 'Approval Type' AND value = 'policy_change'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'special_assessment', 'Special Assessment', 6, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Approval' AND field_name = 'Approval Type' AND value = 'special_assessment'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'vendor_selection', 'Vendor Selection', 7, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Approval' AND field_name = 'Approval Type' AND value = 'vendor_selection'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'contract_approval', 'Contract Approval', 8, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Approval' AND field_name = 'Approval Type' AND value = 'contract_approval'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'capital_expense', 'Capital Expense', 9, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Approval' AND field_name = 'Approval Type' AND value = 'capital_expense'
);

INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, created_by, updated_by)
SELECT 
  '93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'other', 'Other', 10, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'
WHERE NOT EXISTS (
  SELECT 1 FROM dropdown_settings 
  WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
    AND record_type = 'Approval' AND field_name = 'Approval Type' AND value = 'other'
);

-- Verify what was created
SELECT record_type, field_name, value, label, sort_order 
FROM dropdown_settings 
WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
  AND record_type IN ('Inspection', 'Approval')
ORDER BY record_type, field_name, sort_order;
