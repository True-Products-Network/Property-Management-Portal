-- Export dropdowns from Test-True Products Network tenant for seeding
-- Run this in Supabase SQL Editor

WITH reference_tenant AS (
  SELECT id FROM tenants WHERE name = 'Test-True Products Network' LIMIT 1
)
SELECT 
  record_type,
  field_name,
  value,
  label,
  sort_order,
  is_active
FROM dropdown_settings
WHERE tenant_id = (SELECT id FROM reference_tenant)
ORDER BY record_type, field_name, sort_order;

-- To generate TypeScript code, use this query:
/*
WITH reference_tenant AS (
  SELECT id FROM tenants WHERE name = 'Test-True Products Network' LIMIT 1
)
SELECT 
  record_type,
  field_name,
  string_agg(
    format('    { value: "%s", label: "%s", sortOrder: %s, fieldName: "%s" }', 
      value, label, sort_order, field_name
    ), 
    ',\n' ORDER BY sort_order
  ) as items
FROM dropdown_settings
WHERE tenant_id = (SELECT id FROM reference_tenant)
GROUP BY record_type, field_name
ORDER BY record_type, field_name;
*/
