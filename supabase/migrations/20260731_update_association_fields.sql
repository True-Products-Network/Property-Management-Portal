-- Update Association table with additional fields
-- Based on specification requirements

-- First, drop existing constraints and add new ones
ALTER TABLE associations DROP CONSTRAINT IF EXISTS associations_status_check;
ALTER TABLE associations DROP CONSTRAINT IF EXISTS associations_type_check;

-- Update status enum with new values
ALTER TABLE associations ADD CONSTRAINT associations_status_check 
    CHECK (status IN ('prospect', 'onboarding', 'active', 'on_hold', 'ending_management', 'inactive'));

-- Update type enum (Association Type)
ALTER TABLE associations ADD CONSTRAINT associations_type_check 
    CHECK (type IN ('condominium', 'hoa', 'cooperative', 'commercial', 'mixed_use', 'other'));

-- Add new columns
ALTER TABLE associations 
    ADD COLUMN IF NOT EXISTS short_name TEXT,
    ADD COLUMN IF NOT EXISTS tax_id TEXT,
    ADD COLUMN IF NOT EXISTS mailing_address TEXT,
    ADD COLUMN IF NOT EXISTS fiscal_year_end_month TEXT,
    ADD COLUMN IF NOT EXISTS fiscal_year_end_day INTEGER,
    ADD COLUMN IF NOT EXISTS financial_platform TEXT CHECK (financial_platform IN ('stripe', 'paypal')),
    ADD COLUMN IF NOT EXISTS financial_portal_link TEXT,
    ADD COLUMN IF NOT EXISTS document_storage_link TEXT,
    ADD COLUMN IF NOT EXISTS emergency_instructions TEXT,
    ADD COLUMN IF NOT EXISTS general_notes TEXT;

-- Add comment explaining association_id is auto-generated
COMMENT ON COLUMN associations.association_id IS 'Auto-generated unique identifier (e.g., ASSOC-123456)';

-- Create index on new fields
CREATE INDEX IF NOT EXISTS idx_associations_short_name ON associations(short_name);
CREATE INDEX IF NOT EXISTS idx_associations_tax_id ON associations(tax_id);
CREATE INDEX IF NOT EXISTS idx_associations_status ON associations(status);

-- Update existing records to have valid status
UPDATE associations SET status = 'active' WHERE status NOT IN ('prospect', 'onboarding', 'active', 'on_hold', 'ending_management', 'inactive');

-- Update existing records to have valid type (lowercase)
UPDATE associations SET type = LOWER(type);

SELECT 'Association table updated successfully' as result;
