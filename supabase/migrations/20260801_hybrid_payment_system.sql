-- Hybrid Payment System Migration
-- Adds GHL invoice and payment link support to payment_records table
-- Date: August 1, 2026

-- Add new columns to payment_records for hybrid payment system
ALTER TABLE payment_records 
ADD COLUMN IF NOT EXISTS payment_mode TEXT CHECK (payment_mode IN ('manual', 'ghl_invoice', 'ghl_payment_link')),
ADD COLUMN IF NOT EXISTS ghl_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS ghl_payment_link_id TEXT,
ADD COLUMN IF NOT EXISTS ghl_payment_link_url TEXT,
ADD COLUMN IF NOT EXISTS ghl_invoice_number TEXT,
ADD COLUMN IF NOT EXISTS ghl_invoice_status TEXT,
ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accounting_synced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accounting_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accounting_error TEXT;

-- Create index for GHL invoice lookups
CREATE INDEX IF NOT EXISTS idx_payments_ghl_invoice ON payment_records(ghl_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_ghl_link ON payment_records(ghl_payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_mode ON payment_records(payment_mode);
CREATE INDEX IF NOT EXISTS idx_payments_accounting_synced ON payment_records(accounting_synced);

-- Create GHL invoice events table for webhook tracking
CREATE TABLE ghl_invoice_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    ghl_invoice_id TEXT NOT NULL,
    ghl_payment_link_id TEXT,
    payment_record_id UUID REFERENCES payment_records(id),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghl_invoice_events_invoice ON ghl_invoice_events(ghl_invoice_id);
CREATE INDEX IF NOT EXISTS idx_ghl_invoice_events_type ON ghl_invoice_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ghl_invoice_events_processed ON ghl_invoice_events(processed);

-- Enable RLS on new table
ALTER TABLE ghl_invoice_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for ghl_invoice_events
CREATE POLICY "Admins can view invoice events" ON ghl_invoice_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'ADMIN_USER'
        )
    );

-- Add app_settings for Accounting Handoff automation
INSERT INTO app_settings (key, value, category, description) VALUES
('accounting_handoff_enabled', 'false', 'payment', 'Enable automatic accounting handoff for payments'),
('accounting_handoff_webhook_url', '', 'payment', 'Webhook URL for accounting system integration'),
('accounting_handoff_webhook_secret', '', 'payment', 'Secret key for accounting webhook verification'),
('ghl_invoice_webhook_enabled', 'true', 'payment', 'Enable GHL invoice event webhooks'),
('ghl_invoice_default_due_days', '30', 'payment', 'Default number of days until invoice due date')
ON CONFLICT (key) DO NOTHING;

-- Update existing payments to have payment_mode = 'manual' if null
UPDATE payment_records 
SET payment_mode = 'manual' 
WHERE payment_mode IS NULL;
