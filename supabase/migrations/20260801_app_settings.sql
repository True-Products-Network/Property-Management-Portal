-- App Settings table for system-wide configuration
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_encrypted BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage app settings
CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL
    USING (is_admin_user());

-- All authenticated users can read app settings
CREATE POLICY "Users can read app settings" ON app_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert default calendar settings
INSERT INTO app_settings (key, value, description, category) VALUES
    ('ghl_inspection_calendar_id', '', 'GHL Calendar ID for scheduling inspections', 'calendar'),
    ('ghl_inspection_calendar_url', '', 'GHL Calendar booking URL/widget URL for inspections', 'calendar'),
    ('ghl_inspection_calendar_embed', '', 'GHL Calendar embed code for inspections', 'calendar'),
    ('calendar_provider', 'ghl', 'Calendar provider: ghl, calendly, acuity, etc.', 'calendar'),
    ('enable_calendar_integration', 'false', 'Enable calendar integration for scheduling', 'calendar')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
