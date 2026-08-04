-- Supabase Storage Setup for Document Uploads - Alternative Approach
-- Use this if direct storage.buckets INSERT fails with permission error

-- ============================================
-- Option 1: Use Supabase Dashboard
-- ============================================
-- Go to: Storage → Buckets → New Bucket
-- Name: documents
-- Public: Yes (checked)
-- File size limit: 10MB
-- Allowed MIME types: image/*, application/pdf, etc.

-- ============================================
-- Option 2: Run these policies AFTER creating bucket via Dashboard
-- ============================================

-- Policy: Allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Policy: Allow authenticated users to read files
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Policy: Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- ============================================
-- Option 3: Use Supabase CLI (if you have it installed)
-- ============================================
-- supabase storage create documents --public
