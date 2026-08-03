-- GHL Sync Layer Database Schema
-- Creates tables for sync jobs, logs, and state tracking

-- ============================================
-- Sync Jobs Table
-- ============================================
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  ghl_id VARCHAR(255),
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('push', 'pull', 'resolve')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  correlation_id VARCHAR(255),
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for sync_jobs
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status_scheduled ON sync_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_entity ON sync_jobs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_correlation ON sync_jobs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant ON sync_jobs(tenant_id);

-- ============================================
-- Sync Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES sync_jobs(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  ghl_id VARCHAR(255),
  tenant_id UUID REFERENCES tenants(id),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('to_ghl', 'from_ghl')),
  action VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  error_details JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sync_log
CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON sync_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON sync_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_tenant ON sync_log(tenant_id);

-- ============================================
-- Sync State Table (for conflict detection)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_state (
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  ghl_id VARCHAR(255) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  portal_hash VARCHAR(64) NOT NULL,
  ghl_hash VARCHAR(64),
  portal_modified_at TIMESTAMPTZ,
  ghl_modified_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  sync_version INTEGER DEFAULT 1,
  
  PRIMARY KEY (entity_type, entity_id)
);

-- Indexes for sync_state
CREATE INDEX IF NOT EXISTS idx_sync_state_ghl ON sync_state(ghl_id);
CREATE INDEX IF NOT EXISTS idx_sync_state_tenant ON sync_state(tenant_id);

-- ============================================
-- GHL Webhook Events Table (for idempotency)
-- ============================================
CREATE TABLE IF NOT EXISTS ghl_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for deduplication
CREATE INDEX IF NOT EXISTS idx_ghl_webhook_events_id ON ghl_webhook_events(event_id);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_webhook_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS sync_jobs_select_policy ON sync_jobs;
DROP POLICY IF EXISTS sync_jobs_insert_policy ON sync_jobs;
DROP POLICY IF EXISTS sync_jobs_update_policy ON sync_jobs;
DROP POLICY IF EXISTS sync_jobs_delete_policy ON sync_jobs;

DROP POLICY IF EXISTS sync_log_select_policy ON sync_log;
DROP POLICY IF EXISTS sync_log_insert_policy ON sync_log;

DROP POLICY IF EXISTS sync_state_select_policy ON sync_state;
DROP POLICY IF EXISTS sync_state_insert_policy ON sync_state;
DROP POLICY IF EXISTS sync_state_update_policy ON sync_state;

DROP POLICY IF EXISTS ghl_webhook_events_select_policy ON ghl_webhook_events;
DROP POLICY IF EXISTS ghl_webhook_events_insert_policy ON ghl_webhook_events;
DROP POLICY IF EXISTS ghl_webhook_events_update_policy ON ghl_webhook_events;

-- Sync Jobs policies
CREATE POLICY sync_jobs_select_policy ON sync_jobs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY sync_jobs_insert_policy ON sync_jobs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY sync_jobs_update_policy ON sync_jobs
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY sync_jobs_delete_policy ON sync_jobs
  FOR DELETE TO authenticated USING (true);

-- Sync Log policies
CREATE POLICY sync_log_select_policy ON sync_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY sync_log_insert_policy ON sync_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Sync State policies
CREATE POLICY sync_state_select_policy ON sync_state
  FOR SELECT TO authenticated USING (true);

CREATE POLICY sync_state_insert_policy ON sync_state
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY sync_state_update_policy ON sync_state
  FOR UPDATE TO authenticated USING (true);

-- Webhook events policies
CREATE POLICY ghl_webhook_events_select_policy ON ghl_webhook_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY ghl_webhook_events_insert_policy ON ghl_webhook_events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY ghl_webhook_events_update_policy ON ghl_webhook_events
  FOR UPDATE TO authenticated USING (true);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to calculate hash for conflict detection
CREATE OR REPLACE FUNCTION calculate_entity_hash(entity_data JSONB)
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(digest(entity_data::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to check if entity has conflicts
CREATE OR REPLACE FUNCTION check_sync_conflict(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_portal_hash VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_stored_hash VARCHAR(64);
BEGIN
  SELECT portal_hash INTO v_stored_hash
  FROM sync_state
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;
  
  IF v_stored_hash IS NULL THEN
    RETURN false; -- No previous sync, no conflict
  END IF;
  
  RETURN v_stored_hash != p_portal_hash;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE sync_jobs IS 'Queue of synchronization jobs between Portal and GHL';
COMMENT ON TABLE sync_log IS 'Audit log of all sync operations';
COMMENT ON TABLE sync_state IS 'Tracks sync state for conflict detection';
COMMENT ON TABLE ghl_webhook_events IS 'Stores GHL webhook events for idempotency';
