-- Phase 5: Billing Webhooks and Platform Console
-- Multi-Tenant Platform Architecture Implementation
-- Date: August 3, 2026
--
-- This migration:
-- 1. Creates billing events table
-- 2. Adds webhook handling functions
-- 3. Creates billing callback API structure
-- 4. Adds subscription lifecycle management

-- ============================================
-- STEP 1: Create billing_events table
-- ============================================

CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'subscription.created',
        'subscription.updated',
        'subscription.cancelled',
        'subscription.activated',
        'subscription.past_due',
        'payment.succeeded',
        'payment.failed',
        'payment.refunded',
        'payment.disputed',
        'invoice.created',
        'invoice.paid',
        'invoice.payment_failed'
    )),
    
    -- Billing reference (GHL IDs)
    billing_reference TEXT,  -- GHL subscription/payment/invoice ID
    billing_customer_id TEXT,
    
    -- Financial details
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    status TEXT,
    
    -- Event metadata
    metadata JSONB DEFAULT '{}',
    
    -- Processing status
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- Timestamps
    event_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_tenant ON billing_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_reference ON billing_events(billing_reference);
CREATE INDEX IF NOT EXISTS idx_billing_events_processed ON billing_events(processed);
CREATE INDEX IF NOT EXISTS idx_billing_events_created ON billing_events(created_at);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create webhook verification function
-- ============================================

CREATE OR REPLACE FUNCTION verify_billing_webhook(
    p_signature TEXT,
    p_payload TEXT,
    p_secret TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_computed_signature TEXT;
BEGIN
    -- Compute HMAC-SHA256 signature
    v_computed_signature := encode(
        hmac(p_payload, p_secret, 'sha256'),
        'hex'
    );
    
    -- Compare signatures (constant time comparison would be better in application code)
    RETURN v_computed_signature = p_signature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Create webhook processing functions
-- ============================================

-- Process subscription created event
CREATE OR REPLACE FUNCTION process_subscription_created(
    p_tenant_id UUID,
    p_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan_id UUID;
BEGIN
    -- Get plan ID from code
    SELECT id INTO v_plan_id
    FROM plans
    WHERE code = p_data->>'plan_code';
    
    -- Create or update subscription
    INSERT INTO tenant_subscriptions (
        tenant_id,
        plan_id,
        status,
        billing_reference,
        billing_customer_id,
        effective_date,
        trial_ends_at
    )
    VALUES (
        p_tenant_id,
        v_plan_id,
        COALESCE(p_data->>'status', 'active'),
        p_data->>'subscription_id',
        p_data->>'customer_id',
        COALESCE((p_data->>'effective_date')::DATE, CURRENT_DATE),
        (p_data->>'trial_ends_at')::TIMESTAMPTZ
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        status = EXCLUDED.status,
        billing_reference = EXCLUDED.billing_reference,
        billing_customer_id = EXCLUDED.billing_customer_id,
        effective_date = EXCLUDED.effective_date,
        trial_ends_at = EXCLUDED.trial_ends_at,
        updated_at = NOW(),
        updated_by = auth.uid();
    
    -- Log the event
    INSERT INTO platform_audit_events (
        actor_id,
        actor_type,
        tenant_id,
        action,
        action_category,
        target_type,
        target_id,
        new_value
    )
    VALUES (
        auth.uid(),
        'system',
        p_tenant_id,
        'subscription_created',
        'tenant',
        'subscription',
        p_data->>'subscription_id',
        p_data
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process subscription updated event
CREATE OR REPLACE FUNCTION process_subscription_updated(
    p_tenant_id UUID,
    p_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan_id UUID;
    v_old_subscription RECORD;
BEGIN
    -- Get current subscription for audit
    SELECT * INTO v_old_subscription
    FROM tenant_subscriptions
    WHERE tenant_id = p_tenant_id
    ORDER BY effective_date DESC
    LIMIT 1;
    
    -- Get plan ID if changed
    IF p_data->>'plan_code' IS NOT NULL THEN
        SELECT id INTO v_plan_id
        FROM plans
        WHERE code = p_data->>'plan_code';
    END IF;
    
    -- Update subscription
    UPDATE tenant_subscriptions
    SET
        plan_id = COALESCE(v_plan_id, plan_id),
        status = COALESCE(p_data->>'status', status),
        billing_reference = COALESCE(p_data->>'subscription_id', billing_reference),
        cancellation_date = (p_data->>'cancellation_date')::DATE,
        grace_period_ends_at = (p_data->>'grace_period_ends_at')::TIMESTAMPTZ,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE tenant_id = p_tenant_id;
    
    -- Log the event
    INSERT INTO platform_audit_events (
        actor_id,
        actor_type,
        tenant_id,
        action,
        action_category,
        target_type,
        target_id,
        previous_value,
        new_value
    )
    VALUES (
        auth.uid(),
        'system',
        p_tenant_id,
        'subscription_updated',
        'tenant',
        'subscription',
        p_data->>'subscription_id',
        to_jsonb(v_old_subscription),
        p_data
    );
    
    -- Invalidate entitlement cache (would be implemented in application layer)
    -- NOTIFY entitlement_cache_invalidate, p_tenant_id::TEXT;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process subscription cancelled event
CREATE OR REPLACE FUNCTION process_subscription_cancelled(
    p_tenant_id UUID,
    p_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_cancellation_date DATE;
BEGIN
    v_cancellation_date := COALESCE(
        (p_data->>'cancellation_date')::DATE,
        (p_data->>'effective_date')::DATE,
        CURRENT_DATE
    );
    
    -- Update subscription
    UPDATE tenant_subscriptions
    SET
        status = 'cancelled',
        cancellation_date = v_cancellation_date,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE tenant_id = p_tenant_id;
    
    -- Log the event
    INSERT INTO platform_audit_events (
        actor_id,
        actor_type,
        tenant_id,
        action,
        action_category,
        target_type,
        target_id,
        new_value
    )
    VALUES (
        auth.uid(),
        'system',
        p_tenant_id,
        'subscription_cancelled',
        'tenant',
        'subscription',
        p_data->>'subscription_id',
        jsonb_build_object(
            'cancellation_date', v_cancellation_date,
            'reason', p_data->>'reason'
        )
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process payment succeeded event
CREATE OR REPLACE FUNCTION process_payment_succeeded(
    p_tenant_id UUID,
    p_data JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    -- If subscription was past_due, reactivate it
    UPDATE tenant_subscriptions
    SET
        status = 'active',
        grace_period_ends_at = NULL,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE tenant_id = p_tenant_id
    AND status = 'past_due';
    
    -- Log the event
    INSERT INTO platform_audit_events (
        actor_id,
        actor_type,
        tenant_id,
        action,
        action_category,
        target_type,
        target_id,
        new_value
    )
    VALUES (
        auth.uid(),
        'system',
        p_tenant_id,
        'payment_succeeded',
        'tenant',
        'payment',
        p_data->>'payment_id',
        jsonb_build_object(
            'amount', p_data->>'amount',
            'currency', p_data->>'currency'
        )
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process payment failed event
CREATE OR REPLACE FUNCTION process_payment_failed(
    p_tenant_id UUID,
    p_data JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Set subscription to past_due and set grace period
    UPDATE tenant_subscriptions
    SET
        status = 'past_due',
        grace_period_ends_at = NOW() + INTERVAL '7 days',
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE tenant_id = p_tenant_id;
    
    -- Log the event
    INSERT INTO platform_audit_events (
        actor_id,
        actor_type,
        tenant_id,
        action,
        action_category,
        target_type,
        target_id,
        new_value
    )
    VALUES (
        auth.uid(),
        'system',
        p_tenant_id,
        'payment_failed',
        'tenant',
        'payment',
        p_data->>'payment_id',
        jsonb_build_object(
            'amount', p_data->>'amount',
            'failure_code', p_data->>'failure_code',
            'grace_period_ends', NOW() + INTERVAL '7 days'
        )
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: Create main webhook handler function
-- ============================================

CREATE OR REPLACE FUNCTION handle_billing_webhook(
    p_event_type TEXT,
    p_tenant_id UUID,
    p_data JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Record the billing event
    INSERT INTO billing_events (
        tenant_id,
        event_type,
        billing_reference,
        billing_customer_id,
        amount,
        currency,
        status,
        metadata,
        event_timestamp,
        processed,
        processed_at
    )
    VALUES (
        p_tenant_id,
        p_event_type,
        p_data->>'subscription_id',
        p_data->>'customer_id',
        (p_data->>'amount')::DECIMAL,
        COALESCE(p_data->>'currency', 'USD'),
        p_data->>'status',
        p_data,
        COALESCE((p_data->>'timestamp')::TIMESTAMPTZ, NOW()),
        true,
        NOW()
    );
    
    -- Process based on event type
    CASE p_event_type
        WHEN 'subscription.created' THEN
            PERFORM process_subscription_created(p_tenant_id, p_data);
            RETURN QUERY SELECT true, 'Subscription created successfully'::TEXT;
            
        WHEN 'subscription.updated' THEN
            PERFORM process_subscription_updated(p_tenant_id, p_data);
            RETURN QUERY SELECT true, 'Subscription updated successfully'::TEXT;
            
        WHEN 'subscription.cancelled' THEN
            PERFORM process_subscription_cancelled(p_tenant_id, p_data);
            RETURN QUERY SELECT true, 'Subscription cancelled successfully'::TEXT;
            
        WHEN 'subscription.activated' THEN
            PERFORM process_subscription_updated(p_tenant_id, p_data || '{"status": "active"}'::JSONB);
            RETURN QUERY SELECT true, 'Subscription activated successfully'::TEXT;
            
        WHEN 'subscription.past_due' THEN
            PERFORM process_payment_failed(p_tenant_id, p_data);
            RETURN QUERY SELECT true, 'Subscription marked as past due'::TEXT;
            
        WHEN 'payment.succeeded' THEN
            PERFORM process_payment_succeeded(p_tenant_id, p_data);
            RETURN QUERY SELECT true, 'Payment processed successfully'::TEXT;
            
        WHEN 'payment.failed' THEN
            PERFORM process_payment_failed(p_tenant_id, p_data);
            RETURN QUERY SELECT true, 'Payment failure processed'::TEXT;
            
        WHEN 'payment.refunded' THEN
            RETURN QUERY SELECT true, 'Refund recorded'::TEXT;
            
        WHEN 'payment.disputed' THEN
            RETURN QUERY SELECT true, 'Dispute recorded'::TEXT;
            
        ELSE
            RETURN QUERY SELECT true, 'Event recorded but no action taken'::TEXT;
    END CASE;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error
    UPDATE billing_events
    SET processing_error = SQLERRM
    WHERE tenant_id = p_tenant_id
    AND event_type = p_event_type
    AND billing_reference = p_data->>'subscription_id'
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN QUERY SELECT false, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Create subscription status check function
-- ============================================

CREATE OR REPLACE FUNCTION check_subscription_status(
    p_tenant_id UUID
)
RETURNS TABLE (
    status TEXT,
    plan_code TEXT,
    plan_name TEXT,
    is_active BOOLEAN,
    is_grace_period BOOLEAN,
    grace_period_ends_at TIMESTAMPTZ,
    days_until_suspension INTEGER
) AS $$
DECLARE
    v_subscription RECORD;
BEGIN
    SELECT 
        ts.*,
        p.code as plan_code,
        p.name as plan_name
    INTO v_subscription
    FROM tenant_subscriptions ts
    JOIN plans p ON p.id = ts.plan_id
    WHERE ts.tenant_id = p_tenant_id
    ORDER BY ts.effective_date DESC
    LIMIT 1;
    
    IF v_subscription IS NULL THEN
        RETURN QUERY SELECT 
            'no_subscription'::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            false,
            false,
            NULL::TIMESTAMPTZ,
            NULL::INTEGER;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT
        v_subscription.status,
        v_subscription.plan_code,
        v_subscription.plan_name,
        v_subscription.status = 'active',
        v_subscription.status = 'past_due' AND v_subscription.grace_period_ends_at > NOW(),
        v_subscription.grace_period_ends_at,
        CASE 
            WHEN v_subscription.grace_period_ends_at IS NULL THEN NULL
            WHEN v_subscription.grace_period_ends_at <= NOW() THEN 0
            ELSE EXTRACT(DAY FROM (v_subscription.grace_period_ends_at - NOW()))::INTEGER
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: Create grace period enforcement
-- ============================================

-- Function to suspend tenants past grace period
CREATE OR REPLACE FUNCTION enforce_grace_periods()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tenant_id, grace_period_ends_at
        FROM tenant_subscriptions
        WHERE status = 'past_due'
        AND grace_period_ends_at < NOW()
        AND status != 'suspended'
    LOOP
        UPDATE tenant_subscriptions
        SET status = 'suspended',
            updated_at = NOW()
        WHERE tenant_id = r.tenant_id;
        
        -- Log the suspension
        INSERT INTO platform_audit_events (
            actor_id,
            actor_type,
            tenant_id,
            action,
            action_category,
            target_type,
            target_id,
            reason
        )
        VALUES (
            NULL,
            'system',
            r.tenant_id,
            'tenant_suspended',
            'security',
            'tenant',
            r.tenant_id::TEXT,
            'Grace period expired after payment failure'
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 7: Create RLS policies for billing_events
-- ============================================

CREATE POLICY billing_events_platform_admin ON billing_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles_v2 
            WHERE user_id = auth.uid() 
            AND role_type = 'PLATFORM_ADMIN'
            AND revoked_at IS NULL
        )
    );

CREATE POLICY billing_events_tenant_admin ON billing_events
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================
-- STEP 8: Create views for billing dashboard
-- ============================================

-- View: Subscription status for all tenants
CREATE OR REPLACE VIEW tenant_subscription_status AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.code as tenant_code,
    t.status as tenant_status,
    p.code as plan_code,
    p.name as plan_name,
    ts.status as subscription_status,
    ts.effective_date as subscription_start,
    ts.cancellation_date,
    ts.grace_period_ends_at,
    CASE 
        WHEN ts.status = 'active' THEN 'Active'
        WHEN ts.status = 'trialing' THEN 'Trial'
        WHEN ts.status = 'past_due' THEN 'Past Due'
        WHEN ts.status = 'cancelled' THEN 'Cancelled'
        WHEN ts.status = 'suspended' THEN 'Suspended'
        ELSE 'Unknown'
    END as display_status,
    CASE 
        WHEN ts.grace_period_ends_at IS NOT NULL AND ts.grace_period_ends_at > NOW()
        THEN EXTRACT(DAY FROM (ts.grace_period_ends_at - NOW()))::INTEGER
        ELSE NULL
    END as days_in_grace_period
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
LEFT JOIN plans p ON p.id = ts.plan_id
ORDER BY t.name;

-- View: Recent billing events
CREATE OR REPLACE VIEW recent_billing_events AS
SELECT 
    be.*,
    t.name as tenant_name,
    t.code as tenant_code
FROM billing_events be
JOIN tenants t ON t.id = be.tenant_id
WHERE be.created_at > NOW() - INTERVAL '30 days'
ORDER BY be.created_at DESC;

-- View: MRR and revenue summary (Platform Admin only)
CREATE OR REPLACE VIEW revenue_summary AS
SELECT 
    p.code as plan_code,
    p.name as plan_name,
    COUNT(ts.id) as tenant_count,
    SUM(CASE WHEN ts.status = 'active' THEN 1 ELSE 0 END) as active_count,
    SUM(CASE WHEN ts.status = 'past_due' THEN 1 ELSE 0 END) as past_due_count,
    SUM(CASE WHEN ts.status = 'trialing' THEN 1 ELSE 0 END) as trial_count
FROM plans p
LEFT JOIN tenant_subscriptions ts ON ts.plan_id = p.id AND ts.status IN ('active', 'past_due', 'trialing')
GROUP BY p.id, p.code, p.name;

-- ============================================
-- STEP 9: Create API helper functions
-- ============================================

-- Get tenant billing info for API response
CREATE OR REPLACE FUNCTION get_tenant_billing_info(
    p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'tenant_id', t.id,
        'tenant_name', t.name,
        'plan', jsonb_build_object(
            'code', p.code,
            'name', p.name
        ),
        'subscription', jsonb_build_object(
            'status', ts.status,
            'effective_date', ts.effective_date,
            'cancellation_date', ts.cancellation_date,
            'grace_period_ends_at', ts.grace_period_ends_at
        ),
        'recent_events', (
            SELECT jsonb_agg(jsonb_build_object(
                'event_type', be.event_type,
                'amount', be.amount,
                'status', be.status,
                'created_at', be.created_at
            ) ORDER BY be.created_at DESC)
            FROM billing_events be
            WHERE be.tenant_id = p_tenant_id
            LIMIT 10
        )
    )
    INTO v_result
    FROM tenants t
    LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
    LEFT JOIN plans p ON p.id = ts.plan_id
    WHERE t.id = p_tenant_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETION LOG
-- ============================================

INSERT INTO platform_audit_events (
    actor_id,
    actor_type,
    action,
    action_category,
    target_type,
    target_id,
    reason,
    new_value
)
SELECT 
    auth.uid(),
    'system',
    'phase5_migration_completed',
    'tenant',
    'migration',
    '20260803_phase5_billing_webhooks',
    'Phase 5: Billing webhooks and subscription lifecycle implemented',
    jsonb_build_object(
        'actions', ARRAY[
            'Created billing_events table',
            'Created webhook verification function',
            'Created subscription lifecycle functions',
            'Created billing webhook handler',
            'Created grace period enforcement',
            'Created billing dashboard views',
            'Created API helper functions'
        ],
        'timestamp', NOW()
    )
WHERE auth.uid() IS NOT NULL;
