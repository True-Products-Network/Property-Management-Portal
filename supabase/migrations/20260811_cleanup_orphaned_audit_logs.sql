-- Cleanup Orphaned Audit Log Records
-- These records have no tenant_id or business_id and can't be properly attributed
-- It's safer to delete them than leave orphaned data

-- First, let's see what we're dealing with
SELECT 
  'audit_logs' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE tenant_id IS NULL AND business_id IS NULL) as orphaned_records,
  COUNT(*) FILTER (WHERE tenant_id IS NOT NULL) as with_tenant,
  COUNT(*) FILTER (WHERE business_id IS NOT NULL) as with_business
FROM public.audit_logs;

-- Delete orphaned audit logs (no tenant_id AND no business_id)
-- These can't be properly attributed to any tenant/business
DELETE FROM public.audit_logs
WHERE tenant_id IS NULL 
  AND business_id IS NULL;

-- Also check audit_log_settings
SELECT 
  'audit_log_settings' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE tenant_id IS NULL) as orphaned_records
FROM public.audit_log_settings;

-- Delete orphaned audit log settings
DELETE FROM public.audit_log_settings
WHERE tenant_id IS NULL;

-- Verify cleanup
SELECT 
  'audit_logs' as table_name,
  COUNT(*) as remaining_records,
  COUNT(*) FILTER (WHERE tenant_id IS NULL AND business_id IS NULL) as still_orphaned
FROM public.audit_logs
UNION ALL
SELECT 
  'audit_log_settings' as table_name,
  COUNT(*) as remaining_records,
  COUNT(*) FILTER (WHERE tenant_id IS NULL) as still_orphaned
FROM public.audit_log_settings;
