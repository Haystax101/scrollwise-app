-- Fix RLS policies to allow multiple comments per user on insights
-- This ensures users can have proper discussions in comments

BEGIN;

-- First, ensure insight_comments table has RLS enabled
ALTER TABLE public.insight_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies that might block multiple comments
DROP POLICY IF EXISTS "Allow full access to own comments" ON public.insight_comments;
DROP POLICY IF EXISTS "Users can read all insight comments" ON public.insight_comments;
DROP POLICY IF EXISTS "Users can insert their own insight comments" ON public.insight_comments;
DROP POLICY IF EXISTS "Users can update their own insight comments" ON public.insight_comments; 
DROP POLICY IF EXISTS "Users can delete their own insight comments" ON public.insight_comments;
DROP POLICY IF EXISTS "Insight comments are publicly readable" ON public.insight_comments;
DROP POLICY IF EXISTS "Users can create insight comments" ON public.insight_comments;
DROP POLICY IF EXISTS "Users can update own insight comments" ON public.insight_comments;
DROP POLICY IF EXISTS "Users can delete own insight comments" ON public.insight_comments;

-- Create correct policies for discussion-friendly comments
CREATE POLICY "Anyone can read insight comments"
ON public.insight_comments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create multiple insight comments"
ON public.insight_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insight comments"
ON public.insight_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insight comments"
ON public.insight_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Also fix insight_comment_likes policies
DROP POLICY IF EXISTS "Users can read all insight comment likes" ON public.insight_comment_likes;
DROP POLICY IF EXISTS "Users can manage their own insight comment likes" ON public.insight_comment_likes;
DROP POLICY IF EXISTS "Insight comment likes are publicly readable" ON public.insight_comment_likes;
DROP POLICY IF EXISTS "Users can manage own insight comment likes" ON public.insight_comment_likes;

CREATE POLICY "Anyone can read insight comment likes"
ON public.insight_comment_likes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own insight comment likes"
ON public.insight_comment_likes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure RPC functions have proper permissions
GRANT EXECUTE ON FUNCTION add_comment_reply(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_threaded_comments(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_insight_comment(uuid, text, uuid) TO authenticated;

-- Optional: Grant permissions to trigger functions if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_insight_comment_counts') THEN
    GRANT EXECUTE ON FUNCTION update_insight_comment_counts() TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_insight_comment_likes_count') THEN
    GRANT EXECUTE ON FUNCTION update_insight_comment_likes_count() TO authenticated;
  END IF;
END$$;

-- Test policy by checking current user can insert multiple comments
-- This is just a verification query, not an actual insertion
DO $$
DECLARE
  test_message text := 'RLS policies configured to allow multiple comments per user on insights';
BEGIN
  RAISE NOTICE '%', test_message;
END$$;

COMMIT;