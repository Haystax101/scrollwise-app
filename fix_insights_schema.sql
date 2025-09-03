-- Fix schema mismatches for insights
-- The user_content_flags table uses bigint for content_id but insights use uuid

-- 1. First, check current user_content_flags table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_content_flags'
ORDER BY ordinal_position;

-- 2. The issue is that user_content_flags.content_id is bigint but insights.id is uuid
-- We need to modify the table to support both types
-- Option A: Change content_id to text to support both bigint and uuid
-- Option B: Add a separate uuid column for insights

-- Let's go with Option A (safer and cleaner):

-- Change content_id from bigint to text to support both numeric IDs and UUIDs
ALTER TABLE public.user_content_flags 
ALTER COLUMN content_id TYPE text 
USING content_id::text;

-- Update the check constraint if it exists
-- (This allows both numeric strings and UUID strings)

-- 3. Also check if there are similar issues with other tables that reference content_id
-- Let's check content_views table too
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'content_views'
  AND column_name = 'content_id';

-- If content_views also needs fixing:
ALTER TABLE public.content_views 
ALTER COLUMN content_id TYPE text 
USING content_id::text;