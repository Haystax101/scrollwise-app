-- Fix RLS policies for insight_comment_likes table
-- The error indicates users cannot insert new comment likes due to missing RLS policies

-- First, check if the table exists and has RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'insight_comment_likes';

-- Enable RLS if not already enabled
ALTER TABLE public.insight_comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own comment likes" ON public.insight_comment_likes;
DROP POLICY IF EXISTS "Users can insert own comment likes" ON public.insight_comment_likes;
DROP POLICY IF EXISTS "Users can delete own comment likes" ON public.insight_comment_likes;

-- Create proper RLS policies
CREATE POLICY "Users can view own comment likes" ON public.insight_comment_likes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own comment likes" ON public.insight_comment_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comment likes" ON public.insight_comment_likes
  FOR DELETE USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON TABLE public.insight_comment_likes TO authenticated;

-- Test the policies by checking they exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'insight_comment_likes';

-- Show the table structure for reference
\d public.insight_comment_likes;