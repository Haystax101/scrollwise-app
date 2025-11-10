-- Migration: Add 'video' and 'podcast' to content interaction tables
-- This updates the CHECK constraints to allow video and podcast content types

-- =====================================================
-- UPDATE CONTENT_LIKES TABLE
-- =====================================================

-- Drop the old constraint
ALTER TABLE public.content_likes
DROP CONSTRAINT IF EXISTS content_likes_content_type_check;

-- Add new constraint with video and podcast
ALTER TABLE public.content_likes
ADD CONSTRAINT content_likes_content_type_check
CHECK (content_type IN ('article', 'paper', 'video', 'podcast'));

-- =====================================================
-- UPDATE CONTENT_SAVES TABLE
-- =====================================================

-- Drop the old constraint
ALTER TABLE public.content_saves
DROP CONSTRAINT IF EXISTS content_saves_content_type_check;

-- Add new constraint with video and podcast
ALTER TABLE public.content_saves
ADD CONSTRAINT content_saves_content_type_check
CHECK (content_type IN ('article', 'paper', 'video', 'podcast'));

-- =====================================================
-- UPDATE CONTENT_COMMENTS TABLE
-- =====================================================

-- Drop the old constraint
ALTER TABLE public.content_comments
DROP CONSTRAINT IF EXISTS content_comments_content_type_check;

-- Add new constraint with video and podcast
ALTER TABLE public.content_comments
ADD CONSTRAINT content_comments_content_type_check
CHECK (content_type IN ('article', 'paper', 'video', 'podcast'));

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify constraints were updated
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_name IN (
  'content_likes_content_type_check',
  'content_saves_content_type_check',
  'content_comments_content_type_check'
)
ORDER BY tc.table_name;
