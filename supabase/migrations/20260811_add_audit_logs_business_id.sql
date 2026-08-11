-- Add business_id column to audit_logs table
-- This allows tracking at business level alongside tenant level

-- Add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'business_id'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN business_id UUID;
    END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON public.audit_logs(business_id);

-- Update RLS policy to allow inserts with business_id
-- The existing policy should allow all authenticated inserts, but let's verify
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;

CREATE POLICY "audit_logs_insert_policy"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
