# Supabase Storage Setup - Manual Steps

Since SQL access to storage tables is restricted, follow these manual steps:

## Step 1: Create the Bucket

1. Go to Supabase Dashboard → Storage → Buckets
2. Click **"New Bucket"**
3. Name: `documents`
4. **Leave "Public bucket" unchecked** (private)
5. Click **"Create bucket"**

## Step 2: Add RLS Policies via Dashboard

For the `documents` bucket, add these policies:

### Policy 1: Upload
- **Name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

### Policy 2: Read
- **Name**: `Allow authenticated reads`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

### Policy 3: Delete
- **Name**: `Allow authenticated deletes`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

## Step 3: (Optional) Restrict File Types

In your upload code, validate MIME types before upload:
- image/jpeg, image/png, image/gif, image/webp
- application/pdf
- application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
- application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- text/plain

## Step 4: Upload Code Example

```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`${userId}/${fileName}`, file, {
    contentType: file.type,
    upsert: false
  });
```

## Step 5: Generate Signed URLs for Access

```typescript
const { data } = await supabase.storage
  .from('documents')
  .createSignedUrl(`${userId}/${fileName}`, 60); // 60 seconds

// Use data.signedUrl to display/download the file
```
