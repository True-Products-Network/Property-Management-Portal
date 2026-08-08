-- Enhanced Audit Logging Schema
-- Run this in Supabase SQL Editor

-- Add success column to existing audit_logs table
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS request_method VARCHAR(10),
ADD COLUMN IF NOT EXISTS request_path TEXT,
ADD COLUMN IF NOT EXISTS response_status INTEGER,
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
ADD COLUMN IF NOT EXISTS before_values JSONB,
ADD COLUMN IF NOT EXISTS after_values JSONB;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Create a view for enriched audit data
CREATE OR REPLACE VIEW audit_logs_enriched AS
SELECT 
    al.*,
    CASE 
        WHEN al.success = true THEN 'Success'
        WHEN al.success = false THEN 'Failed'
        ELSE 'Unknown'
    END as status_label,
    CASE
        WHEN al.severity = 'critical' THEN 4
        WHEN al.severity = 'error' THEN 3
        WHEN al.severity = 'warning' THEN 2
        ELSE 1
    END as severity_rank
FROM audit_logs al
ORDER BY al.created_at DESC;

-- Create function to auto-cleanup old audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create table for audit log configuration
CREATE TABLE IF NOT EXISTS audit_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    action_type VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    log_success BOOLEAN DEFAULT true,
    log_failure BOOLEAN DEFAULT true,
    retention_days INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, action_type)
);

-- Create index for audit config
CREATE INDEX IF NOT EXISTS idx_audit_config_tenant ON audit_config(tenant_id);

-- Insert default audit configuration for all common actions
INSERT INTO audit_config (action_type, enabled, log_success, log_failure) VALUES
('ASSOCIATION_CREATE', true, true, true),
('ASSOCIATION_UPDATE', true, true, true),
('ASSOCIATION_DELETE', true, true, true),
('ASSOCIATION_VIEW', true, false, true),
('PROPERTY_CREATE', true, true, true),
('PROPERTY_UPDATE', true, true, true),
('PROPERTY_DELETE', true, true, true),
('PROPERTY_VIEW', true, false, true),
('CONTACT_CREATE', true, true, true),
('CONTACT_UPDATE', true, true, true),
('CONTACT_DELETE', true, true, true),
('CONTACT_VIEW', true, false, true),
('MAINTENANCE_CREATE', true, true, true),
('MAINTENANCE_UPDATE', true, true, true),
('MAINTENANCE_DELETE', true, true, true),
('MAINTENANCE_STATUS_CHANGE', true, true, true),
('DOCUMENT_UPLOAD', true, true, true),
('DOCUMENT_DOWNLOAD', true, true, true),
('DOCUMENT_DELETE', true, true, true),
('PAYMENT_CREATE', true, true, true),
('PAYMENT_REFUND', true, true, true),
('PAYMENT_VOID', true, true, true),
('PAYMENT_FAILED', true, true, true),
('USER_LOGIN', true, true, true),
('USER_LOGIN_FAILED', true, true, true),
('USER_LOGOUT', true, true, true),
('USER_PASSWORD_CHANGE', true, true, true),
('USER_MFA_ENABLE', true, true, true),
('USER_MFA_DISABLE', true, true, true),
('ROLE_CREATE', true, true, true),
('ROLE_UPDATE', true, true, true),
('ROLE_DELETE', true, true, true),
('PERMISSION_CHANGE', true, true, true),
('SETTINGS_UPDATE', true, true, true),
('INTEGRATION_CONNECT', true, true, true),
('INTEGRATION_DISCONNECT', true, true, true),
('INTEGRATION_SYNC', true, true, true),
('BULK_EXPORT', true, true, true),
('BULK_IMPORT', true, true, true),
('API_ERROR', true, true, true),
('SYSTEM_ERROR', true, true, true)
ON CONFLICT (tenant_id, action_type) DO NOTHING;
