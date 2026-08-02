-- Feature Flags System Migration
-- Creates tables for feature toggles and user overrides

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    environment TEXT NOT NULL DEFAULT 'all' CHECK (environment IN ('development', 'staging', 'production', 'all')),
    allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['all'],
    user_percentage INTEGER NOT NULL DEFAULT 100 CHECK (user_percentage >= 0 AND user_percentage <= 100),
    associations UUID[],
    properties UUID[],
    users UUID[],
    metadata JSONB,
    created_by UUID REFERENCES contacts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Feature Flag Overrides Table (for user-specific overrides)
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    user_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    association_id UUID REFERENCES associations(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL,
    reason TEXT,
    created_by UUID NOT NULL REFERENCES contacts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Ensure at least one target is specified
    CONSTRAINT override_target_check CHECK (
        user_id IS NOT NULL OR 
        association_id IS NOT NULL OR 
        property_id IS NOT NULL
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_flag ON feature_flag_overrides(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_user ON feature_flag_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_association ON feature_flag_overrides(association_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_property ON feature_flag_overrides(property_id);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_flags
CREATE POLICY "Feature flags are viewable by authenticated users"
    ON feature_flags FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Feature flags are manageable by admin users only"
    ON feature_flags FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.portal_user_id = auth.uid()
            AND contacts.roles @> ARRAY['admin']
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.portal_user_id = auth.uid()
            AND contacts.roles @> ARRAY['admin']
        )
    );

-- RLS Policies for feature_flag_overrides
CREATE POLICY "Feature flag overrides are viewable by authenticated users"
    ON feature_flag_overrides FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Feature flag overrides are manageable by admin users only"
    ON feature_flag_overrides FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.portal_user_id = auth.uid()
            AND contacts.roles @> ARRAY['admin']
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.portal_user_id = auth.uid()
            AND contacts.roles @> ARRAY['admin']
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER trigger_update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();

-- Add comment for documentation
COMMENT ON TABLE feature_flags IS 'Stores feature toggle configuration for gradual rollouts and A/B testing';
COMMENT ON TABLE feature_flag_overrides IS 'Stores user-specific feature flag overrides';
