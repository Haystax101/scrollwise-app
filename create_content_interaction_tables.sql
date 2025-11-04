-- Migration: Create unified content interaction tables for ContentCard
-- These tables handle interactions (likes, saves, comments) for the new content_slides system
-- Separate from legacy article_likes, paper_likes, etc. for clean migration path

-- =====================================================
-- CONTENT LIKES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content_likes (
  user_id uuid NOT NULL,
  content_id integer NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'paper')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT content_likes_pkey PRIMARY KEY (user_id, content_id, content_type),
  CONSTRAINT content_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Index for querying user's likes
CREATE INDEX IF NOT EXISTS idx_content_likes_user_id ON public.content_likes(user_id);

-- Index for counting likes per content
CREATE INDEX IF NOT EXISTS idx_content_likes_content ON public.content_likes(content_id, content_type);

COMMENT ON TABLE public.content_likes IS 'Tracks user likes for content displayed via ContentCard (content_slides)';

-- =====================================================
-- CONTENT SAVES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content_saves (
  user_id uuid NOT NULL,
  content_id integer NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'paper')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT content_saves_pkey PRIMARY KEY (user_id, content_id, content_type),
  CONSTRAINT content_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Index for querying user's saves
CREATE INDEX IF NOT EXISTS idx_content_saves_user_id ON public.content_saves(user_id);

-- Index for counting saves per content
CREATE INDEX IF NOT EXISTS idx_content_saves_content ON public.content_saves(content_id, content_type);

COMMENT ON TABLE public.content_saves IS 'Tracks user saves/bookmarks for content displayed via ContentCard';

-- =====================================================
-- CONTENT COMMENTS TABLE
-- =====================================================

-- Create sequence first (before table uses it)
CREATE SEQUENCE IF NOT EXISTS content_comments_id_seq;

CREATE TABLE IF NOT EXISTS public.content_comments (
  id bigint NOT NULL DEFAULT nextval('content_comments_id_seq'::regclass),
  user_id uuid NOT NULL,
  content_id integer NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'paper')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT content_comments_pkey PRIMARY KEY (id),
  CONSTRAINT content_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Index for querying comments by content
CREATE INDEX IF NOT EXISTS idx_content_comments_content ON public.content_comments(content_id, content_type);

-- Index for querying comments by user
CREATE INDEX IF NOT EXISTS idx_content_comments_user_id ON public.content_comments(user_id);

-- Index for ordering by creation time
CREATE INDEX IF NOT EXISTS idx_content_comments_created_at ON public.content_comments(created_at DESC);

COMMENT ON TABLE public.content_comments IS 'Comments on content displayed via ContentCard';

-- =====================================================
-- CONTENT COMMENT LIKES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content_comment_likes (
  user_id uuid NOT NULL,
  comment_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT content_comment_likes_pkey PRIMARY KEY (user_id, comment_id),
  CONSTRAINT content_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT content_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.content_comments(id) ON DELETE CASCADE
);

-- Index for querying user's comment likes
CREATE INDEX IF NOT EXISTS idx_content_comment_likes_user_id ON public.content_comment_likes(user_id);

-- Index for counting likes per comment
CREATE INDEX IF NOT EXISTS idx_content_comment_likes_comment_id ON public.content_comment_likes(comment_id);

COMMENT ON TABLE public.content_comment_likes IS 'Tracks user likes on content comments';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comment_likes ENABLE ROW LEVEL SECURITY;

-- CONTENT LIKES POLICIES
CREATE POLICY "Users can view all content likes"
  ON public.content_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own content likes"
  ON public.content_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content likes"
  ON public.content_likes FOR DELETE
  USING (auth.uid() = user_id);

-- CONTENT SAVES POLICIES
CREATE POLICY "Users can view all content saves"
  ON public.content_saves FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own content saves"
  ON public.content_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content saves"
  ON public.content_saves FOR DELETE
  USING (auth.uid() = user_id);

-- CONTENT COMMENTS POLICIES
CREATE POLICY "Users can view all content comments"
  ON public.content_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own content comments"
  ON public.content_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content comments"
  ON public.content_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content comments"
  ON public.content_comments FOR DELETE
  USING (auth.uid() = user_id);

-- CONTENT COMMENT LIKES POLICIES
CREATE POLICY "Users can view all content comment likes"
  ON public.content_comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own content comment likes"
  ON public.content_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content comment likes"
  ON public.content_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage to authenticated users
GRANT USAGE ON SEQUENCE content_comments_id_seq TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, DELETE ON public.content_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.content_saves TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.content_comment_likes TO authenticated;

-- =====================================================
-- NOTES
-- =====================================================
-- These tables are designed for the new ContentCard component
-- They use content_id (integer) + content_type (text) to reference original articles/papers
-- This allows clean separation from legacy ArticleCard/PaperCard tables
-- When migrating fully to ContentCard, old tables can be dropped safely