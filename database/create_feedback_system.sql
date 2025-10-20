-- =====================================================
-- Feedback System Database Schema
-- =====================================================
-- This file creates all tables, triggers, and RLS policies
-- for the feedback and feature request system.
--
-- Tables created:
--   1. feedback
--   2. user_feedback_upvotes
--   3. user_feedback_downvotes
--
-- Execute this file in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Table: feedback
-- Primary table storing all feedback items
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL CHECK (length(title) >= 5 AND length(title) <= 200),
  body text NOT NULL CHECK (length(body) >= 10 AND length(body) <= 2000),
  status text NOT NULL DEFAULT 'under_review' CHECK (status = ANY (ARRAY[
    'under_review'::text,
    'in_progress'::text,
    'completed'::text,
    'declined'::text,
    'planned'::text
  ])),
  upvotes_count integer NOT NULL DEFAULT 0 CHECK (upvotes_count >= 0),
  downvotes_count integer NOT NULL DEFAULT 0 CHECK (downvotes_count >= 0),
  dev_response text,
  dev_response_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Table: user_feedback_upvotes
-- Tracks which users have upvoted which feedback items
CREATE TABLE IF NOT EXISTS public.user_feedback_upvotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feedback_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_feedback_upvotes_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_upvotes_unique UNIQUE (user_id, feedback_id),
  CONSTRAINT user_feedback_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_feedback_upvotes_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.feedback(id) ON DELETE CASCADE
);

-- Table: user_feedback_downvotes
-- Tracks which users have downvoted which feedback items
CREATE TABLE IF NOT EXISTS public.user_feedback_downvotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feedback_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_feedback_downvotes_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_downvotes_unique UNIQUE (user_id, feedback_id),
  CONSTRAINT user_feedback_downvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_feedback_downvotes_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.feedback(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Indexes for feedback table
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_upvotes ON public.feedback(upvotes_count DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

-- Indexes for user_feedback_upvotes
CREATE INDEX IF NOT EXISTS idx_user_feedback_upvotes_user ON public.user_feedback_upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_upvotes_feedback ON public.user_feedback_upvotes(feedback_id);

-- Indexes for user_feedback_downvotes
CREATE INDEX IF NOT EXISTS idx_user_feedback_downvotes_user ON public.user_feedback_downvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_downvotes_feedback ON public.user_feedback_downvotes(feedback_id);

-- =====================================================
-- 3. CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Function: Update feedback upvotes count
CREATE OR REPLACE FUNCTION update_feedback_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feedback
    SET upvotes_count = upvotes_count + 1
    WHERE id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feedback
    SET upvotes_count = GREATEST(0, upvotes_count - 1)
    WHERE id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update feedback downvotes count
CREATE OR REPLACE FUNCTION update_feedback_downvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feedback
    SET downvotes_count = downvotes_count + 1
    WHERE id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feedback
    SET downvotes_count = GREATEST(0, downvotes_count - 1)
    WHERE id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update feedback updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

-- Trigger: Update upvotes count on insert/delete
DROP TRIGGER IF EXISTS trigger_update_feedback_upvotes ON public.user_feedback_upvotes;
CREATE TRIGGER trigger_update_feedback_upvotes
AFTER INSERT OR DELETE ON public.user_feedback_upvotes
FOR EACH ROW EXECUTE FUNCTION update_feedback_upvotes_count();

-- Trigger: Update downvotes count on insert/delete
DROP TRIGGER IF EXISTS trigger_update_feedback_downvotes ON public.user_feedback_downvotes;
CREATE TRIGGER trigger_update_feedback_downvotes
AFTER INSERT OR DELETE ON public.user_feedback_downvotes
FOR EACH ROW EXECUTE FUNCTION update_feedback_downvotes_count();

-- Trigger: Update updated_at timestamp on feedback update
DROP TRIGGER IF EXISTS trigger_update_feedback_timestamp ON public.feedback;
CREATE TRIGGER trigger_update_feedback_timestamp
BEFORE UPDATE ON public.feedback
FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback_downvotes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES - FEEDBACK TABLE
-- =====================================================

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Users can view all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.feedback;

-- Policy: Anyone can view all feedback
CREATE POLICY "Users can view all feedback"
  ON public.feedback
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update their own feedback"
  ON public.feedback
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback"
  ON public.feedback
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. CREATE RLS POLICIES - USER_FEEDBACK_UPVOTES TABLE
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all upvotes" ON public.user_feedback_upvotes;
DROP POLICY IF EXISTS "Users can insert their own upvotes" ON public.user_feedback_upvotes;
DROP POLICY IF EXISTS "Users can delete their own upvotes" ON public.user_feedback_upvotes;

-- Policy: Anyone can view all upvotes (needed for displaying vote counts and states)
CREATE POLICY "Users can view all upvotes"
  ON public.user_feedback_upvotes
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own upvotes
CREATE POLICY "Users can insert their own upvotes"
  ON public.user_feedback_upvotes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own upvotes (un-vote)
CREATE POLICY "Users can delete their own upvotes"
  ON public.user_feedback_upvotes
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 8. CREATE RLS POLICIES - USER_FEEDBACK_DOWNVOTES TABLE
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all downvotes" ON public.user_feedback_downvotes;
DROP POLICY IF EXISTS "Users can insert their own downvotes" ON public.user_feedback_downvotes;
DROP POLICY IF EXISTS "Users can delete their own downvotes" ON public.user_feedback_downvotes;

-- Policy: Anyone can view all downvotes (needed for displaying vote counts and states)
CREATE POLICY "Users can view all downvotes"
  ON public.user_feedback_downvotes
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own downvotes
CREATE POLICY "Users can insert their own downvotes"
  ON public.user_feedback_downvotes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own downvotes (un-vote)
CREATE POLICY "Users can delete their own downvotes"
  ON public.user_feedback_downvotes
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on feedback table
GRANT SELECT ON public.feedback TO authenticated;
GRANT SELECT ON public.feedback TO anon;
GRANT INSERT, UPDATE, DELETE ON public.feedback TO authenticated;

-- Grant permissions on user_feedback_upvotes table
GRANT SELECT ON public.user_feedback_upvotes TO authenticated;
GRANT SELECT ON public.user_feedback_upvotes TO anon;
GRANT INSERT, DELETE ON public.user_feedback_upvotes TO authenticated;

-- Grant permissions on user_feedback_downvotes table
GRANT SELECT ON public.user_feedback_downvotes TO authenticated;
GRANT SELECT ON public.user_feedback_downvotes TO anon;
GRANT INSERT, DELETE ON public.user_feedback_downvotes TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES (Optional - Comment out after testing)
-- =====================================================

-- Verify tables were created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('feedback', 'user_feedback_upvotes', 'user_feedback_downvotes');

-- Verify indexes were created
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('feedback', 'user_feedback_upvotes', 'user_feedback_downvotes');

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename IN ('feedback', 'user_feedback_upvotes', 'user_feedback_downvotes');

-- Verify policies were created
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('feedback', 'user_feedback_upvotes', 'user_feedback_downvotes');

-- =====================================================
-- END OF SCRIPT
-- =====================================================
