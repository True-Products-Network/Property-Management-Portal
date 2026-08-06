-- Fix all FK constraints to reference contacts(id) instead of portal_users(id)
-- Run this in Supabase SQL Editor

-- Fix vendors
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_created_by_fkey;
ALTER TABLE vendors ADD CONSTRAINT vendors_created_by_fkey FOREIGN KEY (created_by) REFERENCES contacts(id);
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_updated_by_fkey;
ALTER TABLE vendors ADD CONSTRAINT vendors_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES contacts(id);

-- Fix maintenance_requests
ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_created_by_fkey;
ALTER TABLE maintenance_requests ADD CONSTRAINT maintenance_requests_created_by_fkey FOREIGN KEY (created_by) REFERENCES contacts(id);
ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_updated_by_fkey;
ALTER TABLE maintenance_requests ADD CONSTRAINT maintenance_requests_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES contacts(id);

-- Fix inspections
ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_created_by_fkey;
ALTER TABLE inspections ADD CONSTRAINT inspections_created_by_fkey FOREIGN KEY (created_by) REFERENCES contacts(id);
ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_updated_by_fkey;
ALTER TABLE inspections ADD CONSTRAINT inspections_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES contacts(id);

-- Fix documents
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_created_by_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES contacts(id);
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_updated_by_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES contacts(id);

-- Fix approvals
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_created_by_fkey;
ALTER TABLE approvals ADD CONSTRAINT approvals_created_by_fkey FOREIGN KEY (created_by) REFERENCES contacts(id);
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_updated_by_fkey;
ALTER TABLE approvals ADD CONSTRAINT approvals_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES contacts(id);

-- Fix compliance_items
ALTER TABLE compliance_items DROP CONSTRAINT IF EXISTS compliance_items_created_by_fkey;
ALTER TABLE compliance_items ADD CONSTRAINT compliance_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES contacts(id);
ALTER TABLE compliance_items DROP CONSTRAINT IF EXISTS compliance_items_updated_by_fkey;
ALTER TABLE compliance_items ADD CONSTRAINT compliance_items_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES contacts(id);

-- Also fix properties if needed
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_created_by_fkey;
ALTER TABLE properties ADD CONSTRAINT properties_created_by_fkey FOREIGN KEY (created_by) REFERENCES contacts(id);
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_updated_by_fkey;
ALTER TABLE properties ADD CONSTRAINT properties_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES contacts(id);
