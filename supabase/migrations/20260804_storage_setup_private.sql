-- Supabase Storage Setup for Document Uploads - PRIVATE BUCKET
-- Documents should be private with controlled access via RLS policies

-- ============================================
-- STEP 1: Create bucket via Supabase Dashboard
-- ============================================
-- Go to: Storage → Buckets → New Bucket
-- Name: documents
-- Public: NO (unchecked - private bucket)
-- File size limit: 10MB
-- Allowed MIME types:
--   image/jpeg, image/png, image/gif, image/webp,
--   application/pdf,
--   application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--   application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
--   text/plain

-- ============================================
-- STEP 2: Run these RLS policies after creating the bucket
-- ============================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files to documents bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to read files in their own folder
DROP POLICY IF EXISTS "Allow users to read own documents" ON storage.objects;
CREATE POLICY "Allow users to read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own files
DROP POLICY IF EXISTS "Allow users to delete own documents" ON storage.objects;
CREATE POLICY "Allow users to delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow admin users to read all documents (optional)
-- Uncomment if you want admins to access all documents
-- DROP POLICY IF EXISTS "Allow admins to read all documents" ON storage.objects;
-- CREATE POLICY "Allow admins to read all documents"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'documents'
--   AND EXISTS (
--     SELECT 1 FROM tenant_users tu
--     WHERE tu.user_id = auth.uid()
--     AND tu.role = 'admin'
--   )
-- );

-- ============================================
-- STEP 3: Create folder structure via your app code
-- ============================================
-- In your app, upload files with paths like: {user_id}/{document_type}/{filename}
-- Example: "550e8400-e29b-41d4-a716-446655440000/leases/lease_123.pdf"
