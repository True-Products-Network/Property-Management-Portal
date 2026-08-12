-- Tenant Seed: Workflows
-- Seeds default workflow settings for a new tenant
-- Requires business_id to be set via app.current_business_id variable

DO $$
DECLARE
    v_business_id UUID;
BEGIN
    -- Try to get business_id from variable
    BEGIN
        v_business_id := current_setting('app.current_business_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_business_id := NULL;
    END;
    
    -- If no business_id set, raise error
    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'business_id must be set. Use: SET app.current_business_id = ''your-uuid'';';
    END IF;

    -- Insert default workflows for the business
    INSERT INTO workflows (
        code,
        ghl_workflow_name,
        ghl_workflow_id,
        trigger,
        active,
        message_template,
        reminder_timing,
        escalation_owner,
        description,
        run_count,
        business_id,
        created_at,
        updated_at
    ) VALUES
    ('APPROVAL_REQ', 'Approval Requested', NULL, 'approval_created', true, 
     'A new approval request has been created and requires your review.', 
     '24_hours', 'board_president', 
     'Triggered when a new approval request is created', 0, v_business_id, NOW(), NOW()),
    
    ('COMPLIANCE_ALERT', 'Compliance Alert', NULL, 'compliance_due', false, 
     'A compliance matter is coming due and requires attention.', 
     '7_days', 'property_manager', 
     'Triggered when a compliance matter is approaching due date', 0, v_business_id, NOW(), NOW()),
    
    ('INSP_SCHEDULED', 'Inspection Scheduled', NULL, 'inspection_created', true, 
     'A new inspection has been scheduled.', 
     '24_hours', 'inspector', 
     'Triggered when a new inspection is scheduled', 0, v_business_id, NOW(), NOW()),
    
    ('MAINT_ESCALATE', 'Maintenance Escalation', NULL, 'maintenance_overdue', true, 
     'A maintenance request has been escalated due to inactivity.', 
     '48_hours', 'property_manager', 
     'Triggered when a maintenance request is not addressed within SLA', 0, v_business_id, NOW(), NOW()),
    
    ('MAINT_NEW', 'New Maintenance Request', NULL, 'maintenance_created', true, 
     'A new maintenance request has been submitted and requires assignment.', 
     'immediate', 'maintenance_staff', 
     'Triggered when a new maintenance request is created', 0, v_business_id, NOW(), NOW()),
    
    ('PAYMENT_REC', 'Payment Received', NULL, 'payment_received', true, 
     'A payment has been received and processed.', 
     'immediate', 'finance_user', 
     'Triggered when a payment is recorded', 0, v_business_id, NOW(), NOW())
    
    ON CONFLICT (code, business_id) DO NOTHING;

    RAISE NOTICE 'Workflows seeded successfully for business: %', v_business_id;
END $$;
