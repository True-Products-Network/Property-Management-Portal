-- Fix unit type dropdown values to match existing data
-- Run this in Supabase SQL Editor

-- Update dropdown values to have proper casing that matches existing unit data
UPDATE dropdown_values 
SET value = 'Townhouse'
WHERE value = 'townhouse' AND dropdown_id IN (
  SELECT id FROM dropdowns WHERE record_type = 'Unit' AND field_name = 'type'
);

-- Add other common unit types that might be in existing data but not in dropdown
-- First check what's in the units table
SELECT DISTINCT type FROM units WHERE type IS NOT NULL AND type NOT IN (
  SELECT value FROM dropdown_values dv
  JOIN dropdowns d ON dv.dropdown_id = d.id
  WHERE d.record_type = 'Unit' AND d.field_name = 'type'
);
