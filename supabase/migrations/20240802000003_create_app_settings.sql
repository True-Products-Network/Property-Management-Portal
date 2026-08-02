-- Create app_settings table for system configuration
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_encrypted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "App settings are viewable by authenticated users" ON app_settings;
CREATE POLICY "App settings are viewable by authenticated users"
    ON app_settings FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "App settings are manageable by admin users only" ON app_settings;
CREATE POLICY "App settings are manageable by admin users only"
    ON app_settings FOR ALL
    TO authenticated
    USING (is_admin_from_jwt())
    WITH CHECK (is_admin_from_jwt());

-- Insert default branding settings
INSERT INTO app_settings (key, value, description, category, is_public) VALUES
    ('portal_name', 'Property Management Portal', 'Name of the portal', 'branding', true),
    ('portal_logo_url', '', 'URL to portal logo', 'branding', true),
    ('primary_color', '#062F52', 'Primary brand color', 'branding', true),
    ('secondary_color', '#07838B', 'Secondary brand color', 'branding', true),
    ('favicon_url', '', 'URL to favicon', 'branding', true)
ON CONFLICT (key) DO NOTHING;

-- Insert default feature settings
INSERT INTO app_settings (key, value, description, category, is_public) VALUES
    ('enable_calendar_integration', 'false', 'Enable calendar integration', 'features', true),
    ('enable_live_chat', 'false', 'Enable live chat widget', 'features', true),
    ('calendar_provider', '', 'Calendar provider (google, outlook, etc)', 'features', true)
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_app_settings_updated_at ON app_settings;
CREATE TRIGGER trigger_update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_app_settings_updated_at();

-- Add comment
COMMENT ON TABLE app_settings IS 'Application settings and configuration';
