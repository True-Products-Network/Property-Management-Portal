-- Create GHL credentials table
-- Stores encrypted GHL tokens and API keys with AES-256 encryption

CREATE TABLE IF NOT EXISTS ghl_credentials (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('oauth', 'api_key')),
    
    -- OAuth fields (encrypted with AES-256)
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    company_id VARCHAR(255),
    scopes TEXT,
    
    -- API Key field (encrypted with AES-256)
    api_key TEXT,
    
    -- Common fields
    location_id VARCHAR(255),
    location_name VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE ghl_credentials IS 'Stores encrypted GHL integration credentials (AES-256)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ghl_credentials_type ON ghl_credentials(type);

-- Enable RLS (Row Level Security)
ALTER TABLE ghl_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy: Only admin users can access credentials
CREATE POLICY "Admin users can manage GHL credentials"
    ON ghl_credentials
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'ADMIN_USER'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ghl_credentials_updated_at ON ghl_credentials;
CREATE TRIGGER update_ghl_credentials_updated_at
    BEFORE UPDATE ON ghl_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
