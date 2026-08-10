-- Fix property manager foreign key to reference contacts instead of portal_users
-- This allows assigning property managers before they have portal accounts

-- Drop existing foreign key constraint
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_assigned_staff_id_fkey;

-- Add new foreign key constraint referencing contacts
ALTER TABLE properties 
ADD CONSTRAINT properties_assigned_staff_id_fkey 
FOREIGN KEY (assigned_staff_id) REFERENCES contacts(id) ON DELETE SET NULL;
