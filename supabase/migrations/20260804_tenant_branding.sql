-- Create tenant_branding table for white-label support
CREATE TABLE IF NOT EXISTS tenant_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL DEFAULT 'Associos Property Management',
    brand_name_line2 TEXT DEFAULT '',
    brand_logo_url TEXT,
    brand_logo_svg TEXT,
    brand_favicon_url TEXT,
    brand_primary_color TEXT DEFAULT '#0d3b66',
    brand_secondary_color TEXT DEFAULT '#f4d35e',
    brand_accent_color TEXT DEFAULT '#f4d35e',
    custom_css TEXT,
    email_header_image TEXT,
    email_footer_text TEXT,
    support_email TEXT,
    support_phone TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(tenant_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_branding_tenant ON tenant_branding(tenant_id);

-- Enable RLS
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_branding_tenant_isolation ON tenant_branding
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
        OR is_platform_admin()
    );

-- Function to get or create default branding for a tenant
CREATE OR REPLACE FUNCTION get_tenant_branding(p_tenant_id UUID)
RETURNS TABLE (
    brand_name TEXT,
    brand_name_line2 TEXT,
    brand_logo_url TEXT,
    brand_logo_svg TEXT,
    brand_favicon_url TEXT,
    brand_primary_color TEXT,
    brand_secondary_color TEXT,
    brand_accent_color TEXT
) AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if branding exists for this tenant
    SELECT EXISTS(
        SELECT 1 FROM tenant_branding WHERE tenant_id = p_tenant_id
    ) INTO v_exists;
    
    -- If not exists, return default values
    IF NOT v_exists THEN
        RETURN QUERY SELECT 
            'Associos Property Management'::TEXT,
            ''::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            '#0d3b66'::TEXT,
            '#f4d35e'::TEXT,
            '#f4d35e'::TEXT;
        RETURN;
    END IF;
    
    -- Return existing branding
    RETURN QUERY
    SELECT 
        tb.brand_name,
        tb.brand_name_line2,
        tb.brand_logo_url,
        tb.brand_logo_svg,
        tb.brand_favicon_url,
        tb.brand_primary_color,
        tb.brand_secondary_color,
        tb.brand_accent_color
    FROM tenant_branding tb
    WHERE tb.tenant_id = p_tenant_id
    AND tb.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize default branding when tenant is created
CREATE OR REPLACE FUNCTION initialize_tenant_branding()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tenant_branding (
        tenant_id,
        brand_name,
        brand_name_line2,
        brand_primary_color,
        brand_secondary_color,
        support_email,
        created_by
    ) VALUES (
        NEW.id,
        COALESCE(NEW.name, 'Associos Property Management'),
        'Property Management',
        '#0d3b66',
        '#f4d35e',
        NEW.primary_email,
        NEW.created_by
    )
    ON CONFLICT (tenant_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create branding when tenant is created
DROP TRIGGER IF EXISTS trigger_initialize_tenant_branding ON tenants;
CREATE TRIGGER trigger_initialize_tenant_branding
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION initialize_tenant_branding();

-- Insert default branding for existing tenants that don't have it
INSERT INTO tenant_branding (
    tenant_id,
    brand_name,
    brand_name_line2,
    brand_primary_color,
    brand_secondary_color,
    support_email
)
SELECT 
    t.id,
    COALESCE(t.name, 'Associos Property Management'),
    'Property Management',
    '#0d3b66',
    '#f4d35e',
    t.primary_email
FROM tenants t
LEFT JOIN tenant_branding tb ON t.id = tb.tenant_id
WHERE tb.id IS NULL;
