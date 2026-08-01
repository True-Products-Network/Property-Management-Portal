-- Brand Customization Settings
INSERT INTO app_settings (key, value, description, category) VALUES
    ('brand_logo_url', '', 'URL to company logo image (recommended: 32x32px or 64x64px)', 'branding'),
    ('brand_logo_svg', '', 'SVG logo code for crisp rendering at any size', 'branding'),
    ('brand_name_line1', 'Exemplary', 'Company name - first line (main name)', 'branding'),
    ('brand_name_line2', 'Property Management', 'Company name - second line (tagline/subtitle)', 'branding'),
    ('brand_primary_color', '#0d3b66', 'Primary brand color (hex)', 'branding'),
    ('brand_secondary_color', '#f4d35e', 'Secondary brand color (hex)', 'branding'),
    ('brand_favicon_url', '', 'URL to favicon image', 'branding'),
    ('ghl_chat_widget_code', '', 'GHL or other chat widget embed code', 'branding'),
    ('enable_live_chat', 'false', 'Enable live chat widget on help page', 'branding')
ON CONFLICT (key) DO NOTHING;
