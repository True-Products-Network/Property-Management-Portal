-- Fix dropdowns with null tenant_id
-- These are global/shared dropdowns

-- ============================================
-- DELETE EXISTING (with null tenant_id)
-- ============================================

DELETE FROM dropdown_settings 
WHERE tenant_id IS NULL
  AND record_type IN ('Inspection', 'Approval');

-- ============================================
-- INSERT INSPECTION DROPDOWNS (with null tenant_id for global)
-- ============================================

-- Inspection Type
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, is_default, created_by, updated_by)
VALUES 
  (NULL, 'Inspection', 'Inspection Type', 'routine', 'Routine', 1, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'move_in', 'Move In', 2, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'move_out', 'Move Out', 3, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'annual', 'Annual', 4, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'fire_safety', 'Fire Safety', 5, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'elevator', 'Elevator', 6, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'hvac', 'HVAC', 7, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'roof', 'Roof', 8, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'pool', 'Pool', 9, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'emergency_systems', 'Emergency Systems', 10, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'insurance', 'Insurance', 11, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Type', 'other', 'Other', 12, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09');

-- Inspection Status
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, is_default, created_by, updated_by)
VALUES 
  (NULL, 'Inspection', 'Inspection Status', 'scheduled', 'Scheduled', 1, true, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Status', 'in_progress', 'In Progress', 2, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Status', 'completed', 'Completed', 3, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Status', 'overdue', 'Overdue', 4, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Status', 'cancelled', 'Cancelled', 5, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Inspection Status', 'rescheduled', 'Rescheduled', 6, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09');

-- Overall Result (Rating)
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, is_default, created_by, updated_by)
VALUES 
  (NULL, 'Inspection', 'Overall Result', 'excellent', 'Excellent', 1, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Overall Result', 'good', 'Good', 2, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Overall Result', 'fair', 'Fair', 3, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Overall Result', 'poor', 'Poor', 4, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Inspection', 'Overall Result', 'critical', 'Critical', 5, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09');

-- ============================================
-- INSERT APPROVAL DROPDOWNS (with null tenant_id for global)
-- ============================================

-- Approval Type
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, is_default, created_by, updated_by)
VALUES 
  (NULL, 'Approval', 'Approval Type', 'maintenance', 'Maintenance Approval', 1, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Approval', 'Approval Type', 'capital_improvement', 'Capital Improvement', 2, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Approval', 'Approval Type', 'vendor_contract', 'Vendor Contract', 3, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Approval', 'Approval Type', 'budget_item', 'Budget Item', 4, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Approval', 'Approval Type', 'policy_change', 'Policy Change', 5, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Approval', 'Approval Type', 'special_assessment', 'Special Assessment', 6, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Approval', 'Approval Type', 'vendor_selection', 'Vendor Selection', 7, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Approval', 'Approval Type', 'contract_approval', 'Contract Approval', 8, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Approval', 'Approval Type', 'capital_expense', 'Capital Expense', 9, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  (NULL, 'Approval', 'Approval Type', 'other', 'Other', 10, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09');

-- Verify what was created
SELECT record_type, field_name, value, label, sort_order 
FROM dropdown_settings 
WHERE (tenant_id IS NULL OR tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b')
  AND record_type IN ('Inspection', 'Approval')
ORDER BY record_type, field_name, sort_order;
