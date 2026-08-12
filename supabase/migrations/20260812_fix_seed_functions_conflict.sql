-- Fix ON CONFLICT clause in exec_sql_with_tenant function
-- The previous version had incorrect ON CONFLICT columns

CREATE OR REPLACE FUNCTION exec_sql_with_tenant(
    sql_file TEXT,
    tenant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set the tenant_id for the session
    PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, true);
    
    -- Execute the appropriate seed file based on sql_file parameter
    CASE sql_file
        WHEN 'tenant_seed_dropdowns' THEN
            -- The tenant_seed_dropdowns.sql uses DO block with current_setting
            -- We need to execute it differently
            RAISE NOTICE 'Execute tenant_seed_dropdowns.sql manually or via migration';
        WHEN 'tenant_seed_ghl_mappings' THEN
            -- GHL mappings are global, no tenant_id needed
            INSERT INTO ghl_role_mappings (
                ghl_contact_role, portal_role, portal_version, default_permissions,
                requires_mfa, status, description, user_count, created_at, updated_at
            )
            VALUES
                ('Admin User', 'Admin User', 'v2', 'full_access', true, 'active', 'Full portal administration access', 0, NOW(), NOW()),
                ('Board Approver', 'Board Approver', 'v2', 'approval_access', false, 'active', 'Can approve board requests', 0, NOW(), NOW()),
                ('Board Member', 'Board Member', 'v2', 'board_access', false, 'active', 'Board view and approvals', 0, NOW(), NOW()),
                ('Inspector', 'Inspector', 'v2', 'inspection_access', false, 'active', 'Property inspections', 0, NOW(), NOW()),
                ('Property Manager', 'Management Staff', 'v2', 'management_access', false, 'active', 'Property Management', 0, NOW(), NOW()),
                ('Owner', 'Owner', 'v2', 'owner_access', false, 'active', 'Own associated records', 0, NOW(), NOW()),
                ('Resident', 'Resident', 'v2', 'resident_access', false, 'active', 'Unit and building access', 0, NOW(), NOW()),
                ('Bookkeeper', 'Restricted Finance', 'v2', 'finance_readonly', false, 'active', 'Financial view only', 0, NOW(), NOW()),
                ('Vendor Contact', 'Vendor Contact', 'v2', 'vendor_access', false, 'active', 'Vendor job assignments', 0, NOW(), NOW())
            ON CONFLICT (ghl_contact_role) DO NOTHING;
        ELSE
            RAISE EXCEPTION 'Unknown SQL file: %', sql_file;
    END CASE;
END;
$$;

-- Also fix exec_sql_with_business to ensure it's correct
CREATE OR REPLACE FUNCTION exec_sql_with_business(
    sql_file TEXT,
    business_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set the business_id for the session
    PERFORM set_config('app.current_business_id', business_id::TEXT, true);
    
    -- Execute the appropriate seed file
    CASE sql_file
        WHEN 'tenant_seed_workflows' THEN
            INSERT INTO workflows (
                code, ghl_workflow_name, trigger, active, message_template,
                reminder_timing, escalation_owner, description, run_count,
                business_id, created_at, updated_at
            )
            VALUES
                ('APPROVAL_REQ', 'Approval Requested', 'approval_created', true, 
                 'A new approval request requires your review.', '24_hours', 'board_president',
                 'New approval request created', 0, business_id, NOW(), NOW()),
                ('COMPLIANCE_ALERT', 'Compliance Alert', 'compliance_due', false,
                 'Compliance matter approaching due date.', '7_days', 'property_manager',
                 'Compliance due date alert', 0, business_id, NOW(), NOW()),
                ('INSP_SCHEDULED', 'Inspection Scheduled', 'inspection_created', true,
                 'New inspection scheduled.', '24_hours', 'inspector',
                 'Inspection scheduled', 0, business_id, NOW(), NOW()),
                ('MAINT_ESCALATE', 'Maintenance Escalation', 'maintenance_overdue', true,
                 'Maintenance request escalated.', '48_hours', 'property_manager',
                 'Maintenance SLA exceeded', 0, business_id, NOW(), NOW()),
                ('MAINT_NEW', 'New Maintenance Request', 'maintenance_created', true,
                 'New maintenance request submitted.', 'immediate', 'maintenance_staff',
                 'New maintenance request', 0, business_id, NOW(), NOW()),
                ('PAYMENT_REC', 'Payment Received', 'payment_received', true,
                 'Payment received and processed.', 'immediate', 'finance_user',
                 'Payment recorded', 0, business_id, NOW(), NOW())
            ON CONFLICT (code, business_id) DO NOTHING;
        ELSE
            RAISE EXCEPTION 'Unknown SQL file: %', sql_file;
    END CASE;
END;
$$;
