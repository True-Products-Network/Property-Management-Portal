-- Migration: Create workflows table
-- Date: 2026-08-02

-- ============================================
-- Workflows Table
-- ============================================
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    ghl_workflow_name TEXT NOT NULL,
    ghl_workflow_id TEXT,
    trigger TEXT DEFAULT 'manual',
    active BOOLEAN DEFAULT true,
    message_template TEXT,
    reminder_timing TEXT DEFAULT 'none',
    escalation_owner TEXT,
    description TEXT,
    run_count INTEGER DEFAULT 0,
    last_test TIMESTAMPTZ,
    last_successful_run TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows
CREATE POLICY "workflows_select_policy" ON workflows
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "workflows_insert_policy" ON workflows
    FOR INSERT TO authenticated
    WITH CHECK (is_admin_user());

CREATE POLICY "workflows_update_policy" ON workflows
    FOR UPDATE TO authenticated
    USING (is_admin_user());

CREATE POLICY "workflows_delete_policy" ON workflows
    FOR DELETE TO authenticated
    USING (is_admin_user());

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workflows_code ON workflows(code);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(active);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows(trigger);

-- ============================================
-- Update Trigger for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Insert Default Workflows
-- ============================================
INSERT INTO workflows (code, ghl_workflow_name, ghl_workflow_id, trigger, active, message_template, reminder_timing, escalation_owner, description, run_count)
VALUES 
    ('MAINT_NEW', 'New Maintenance Request', 'wf_123456', 'record_created', true, 'A new maintenance request has been submitted for {{property_name}}.', '24_hours', 'Property Manager', 'Triggered when a new maintenance request is created', 156),
    ('MAINT_ESCALATE', 'Maintenance Escalation', 'wf_123457', 'status_changed', true, 'Maintenance request {{request_number}} requires escalation.', '1_hour', 'Admin User', 'Triggered when maintenance request is escalated', 23),
    ('INSP_SCHEDULED', 'Inspection Scheduled', 'wf_123458', 'scheduled_date', true, 'Inspection scheduled for {{unit_number}} on {{inspection_date}}.', '24_hours', 'Inspector', 'Triggered when inspection is scheduled', 89),
    ('APPROVAL_REQ', 'Approval Requested', 'wf_123459', 'approval_requested', true, 'Your approval is requested for {{approval_type}} - ${{amount}}.', '3_days', 'Board Approver', 'Triggered when approval is requested', 45),
    ('PAYMENT_REC', 'Payment Received', 'wf_123460', 'payment_received', true, 'Payment of ${{amount}} received from {{contact_name}}.', 'none', 'Bookkeeper', 'Triggered when payment is received', 234),
    ('COMPLIANCE_ALERT', 'Compliance Alert', 'wf_123461', 'scheduled_date', false, 'Compliance matter {{compliance_title}} requires attention.', '7_days', 'Property Manager', 'Triggered for compliance due dates', 0)
ON CONFLICT (code) DO NOTHING;
