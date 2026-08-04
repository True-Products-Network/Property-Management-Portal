-- Create GHL Sync Logs table
-- Tracks synchronization history for GHL integrations

CREATE TABLE IF NOT EXISTS ghl_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES association_ghl_connections(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('contacts', 'companies', 'opportunities', 'full')),
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ghl_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ghl_sync_logs_platform_admin ON ghl_sync_logs FOR ALL USING (is_platform_admin());
CREATE POLICY ghl_sync_logs_tenant_admin ON ghl_sync_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM association_ghl_connections agc
        JOIN associations a ON agc.association_id = a.id
        JOIN tenant_users tu ON tu.tenant_id = a.tenant_id
        WHERE agc.id = ghl_sync_logs.connection_id
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
);

-- Indexes
CREATE INDEX idx_ghl_sync_logs_connection ON ghl_sync_logs(connection_id);
CREATE INDEX idx_ghl_sync_logs_started_at ON ghl_sync_logs(started_at DESC);
CREATE INDEX idx_ghl_sync_logs_status ON ghl_sync_logs(status);

-- Comments
COMMENT ON TABLE ghl_sync_logs IS 'Tracks GHL synchronization history for debugging and monitoring';
