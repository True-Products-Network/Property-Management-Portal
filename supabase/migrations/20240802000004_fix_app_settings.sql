-- Fix app_settings table - add updated_by column
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Also add created_by for consistency
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
