-- Add tenant_id column to dropdown_settings table
-- Run this in Supabase SQL Editor

-- 1. Add tenant_id column
ALTER TABLE dropdown_settings 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_dropdown_settings_tenant ON dropdown_settings(tenant_id);

-- 3. Update existing unit type dropdowns with tenant_id
UPDATE dropdown_settings 
SET tenant_id = '93f8cdcf-7dcd-4d83-8117-67d869eab88b'
WHERE record_type = 'unit' AND field_name = 'type' AND tenant_id IS NULL;

-- 4. Verify
SELECT record_type, field_name, value, label, tenant_id 
FROM dropdown_settings 
WHERE record_type = 'unit' AND field_name = 'type';
