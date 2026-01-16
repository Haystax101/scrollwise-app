-- Storage Setup for 'content-images'
-- Run this in Supabase SQL Editor

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS (Should be on by default for new buckets, but good to ensure)
-- Note: You can't easily run "ALTER TABLE" on storage.objects via SQL Editor typically, 
-- but policies are applied to storage.objects.

-- 3. Policy: Allow Authenticated Users to Upload (INSERT)
-- The policy in your screenshot was restricted to a specific file and user. 
-- This one allows ANY authenticated user to upload ANY file to this bucket.
CREATE POLICY "Authenticated users can upload content images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-images'
);

-- 4. Policy: Allow Public to View (SELECT)
CREATE POLICY "Public can view content images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'content-images'
);

-- 5. Policy: Users can update/delete their own files (Optional but good)
CREATE POLICY "Users can update own content images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'content-images' 
  AND owner = auth.uid()
);

CREATE POLICY "Users can delete own content images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-images' 
  AND owner = auth.uid()
);
