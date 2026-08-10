-- Make dropdown_settings tenant-specific
-- This migration:
-- 1. Drops the old unique constraint (without tenant_id)
-- 2. Updates existing null tenant_ids to a default tenant
-- 3. Adds new unique constraint including tenant_id
-- 4. Makes tenant_id NOT NULL

-- ============================================
-- STEP 1: Update existing dropdowns with null tenant_id
-- ============================================

-- Set default tenant for all null tenant_ids
UPDATE dropdown_settings 
SET tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
WHERE tenant_id IS NULL;

-- ============================================
-- STEP 2: Drop old unique constraint
-- ============================================

ALTER TABLE dropdown_settings 
DROP CONSTRAINT IF EXISTS dropdown_settings_record_type_field_name_value_key;

-- ============================================
-- STEP 3: Add new unique constraint with tenant_id
-- ============================================

ALTER TABLE dropdown_settings 
ADD CONSTRAINT dropdown_settings_tenant_record_field_value_unique 
UNIQUE (tenant_id, record_type, field_name, value);

-- ============================================
-- STEP 4: Make tenant_id NOT NULL
-- ============================================

ALTER TABLE dropdown_settings 
ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================
-- STEP 5: Add missing dropdowns for Inspection and Approval
-- ============================================

-- First delete any existing Inspection/Approval for this tenant to avoid conflicts
DELETE FROM dropdown_settings 
WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
  AND record_type IN ('Inspection', 'Approval');

-- Inspection Type
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, is_default, created_by, updated_by)
VALUES 
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'routine', 'Routine', 1, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'move_in', 'Move In', 2, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'move_out', 'Move Out', 3, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'annual', 'Annual', 4, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'fire_safety', 'Fire Safety', 5, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'elevator', 'Elevator', 6, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'hvac', 'HVAC', 7, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'roof', 'Roof', 8, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'pool', 'Pool', 9, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'emergency_systems', 'Emergency Systems', 10, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'insurance', 'Insurance', 11, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Type', 'other', 'Other', 12, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09');

-- Inspection Status
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, is_default, created_by, updated_by)
VALUES 
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'scheduled', 'Scheduled', 1, true, true, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'in_progress', 'In Progress', 2, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'completed', 'Completed', 3, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'overdue', 'Overdue', 4, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'cancelled', 'Cancelled', 5, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Inspection Status', 'rescheduled', 'Rescheduled', 6, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09');

-- Overall Result (Rating)
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, is_default, created_by, updated_by)
VALUES 
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Overall Result', 'excellent', 'Excellent', 1, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Overall Result', 'good', 'Good', 2, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Overall Result', 'fair', 'Fair', 3, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Overall Result', 'poor', 'Poor', 4, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Inspection', 'Overall Result', 'critical', 'Critical', 5, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09');

-- Approval Type
INSERT INTO dropdown_settings (tenant_id, record_type, field_name, value, label, sort_order, is_active, is_default, created_by, updated_by)
VALUES 
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'maintenance', 'Maintenance Approval', 1, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'capital_improvement', 'Capital Improvement', 2, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'vendor_contract', 'Vendor Contract', 3, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'budget_item', 'Budget Item', 4, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'policy_change', 'Policy Change', 5, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'special_assessment', 'Special Assessment', 6, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'vendor_selection', 'Vendor Selection', 7, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'contract_approval', 'Contract Approval', 8, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'capital_expense', 'Capital Expense', 9, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09'),
  ('93f8cdcf-7dcd-4d83-8117-67d869eab88b', 'Approval', 'Approval Type', 'other', 'Other', 10, true, false, '97cbd505-95e3-472f-b924-75d309c29a09', '97cbd505-95e3-472f-b924-75d309c29a09');

-- Verify the changes
SELECT record_type, field_name, COUNT(*) as count
FROM dropdown_settings 
WHERE tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
  AND record_type IN ('Inspection', 'Approval')
GROUP BY record_type, field_name
ORDER BY record_type, field_name;
