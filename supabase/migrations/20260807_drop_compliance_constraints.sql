-- Drop CHECK constraints on compliance_matters to allow flexible category values

ALTER TABLE compliance_matters 
DROP CONSTRAINT IF EXISTS compliance_matters_category_check;

ALTER TABLE compliance_matters 
DROP CONSTRAINT IF EXISTS compliance_matters_priority_check;

ALTER TABLE compliance_matters
DROP CONSTRAINT IF EXISTS compliance_matters_status_check;
