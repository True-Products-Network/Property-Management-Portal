-- Fix missing columns in audit_logs table
-- Run this in Supabase SQL Editor

-- Add all missing columns that the enhanced logger expects
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'info',
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS request_method VARCHAR(10),
ADD COLUMN IF NOT EXISTS request_path TEXT,
ADD COLUMN IF NOT EXISTS response_status INTEGER,
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
ADD COLUMN IF NOT EXISTS before_values JSONB,
ADD COLUMN IF NOT EXISTS after_values JSONB,
ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS error_stack TEXT,
ADD COLUMN IF NOT EXISTS entity_name TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;
