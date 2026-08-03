-- Association-level GHL Credentials
-- Stores GHL connection credentials per association (not business-wide)

CREATE TABLE IF NOT EXISTS association_ghl_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('oauth', 'api_key')),
  
  -- OAuth fields
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  
  -- API Key field
  api_key TEXT,
  
  -- Location info
  location_id VARCHAR(255),
  location_name VARCHAR(255),
  company_id VARCHAR(255),
  
  -- Webhook configuration
  webhook_url TEXT,
  webhook_secret TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(association_id)
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_assoc_ghl_creds_association ON association_ghl_credentials(association_id);

-- Add GHL fields to associations table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'associations' AND column_name = 'ghl_location_id') THEN
    ALTER TABLE associations ADD COLUMN ghl_location_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'associations' AND column_name = 'ghl_location_name') THEN
    ALTER TABLE associations ADD COLUMN ghl_location_name VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'associations' AND column_name = 'ghl_company_id') THEN
    ALTER TABLE associations ADD COLUMN ghl_company_id VARCHAR(255);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE association_ghl_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS association_ghl_creds_select_policy ON association_ghl_credentials;
DROP POLICY IF EXISTS association_ghl_creds_insert_policy ON association_ghl_credentials;
DROP POLICY IF EXISTS association_ghl_creds_update_policy ON association_ghl_credentials;
DROP POLICY IF EXISTS association_ghl_creds_delete_policy ON association_ghl_credentials;

-- RLS Policies
CREATE POLICY association_ghl_creds_select_policy ON association_ghl_credentials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY association_ghl_creds_insert_policy ON association_ghl_credentials
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY association_ghl_creds_update_policy ON association_ghl_credentials
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY association_ghl_creds_delete_policy ON association_ghl_credentials
  FOR DELETE TO authenticated USING (true);

-- Comments
COMMENT ON TABLE association_ghl_credentials IS 'Stores GHL OAuth/API credentials per association for multi-tenant setup';
