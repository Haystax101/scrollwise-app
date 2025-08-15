-- Create unified view tracking system
-- This tracks when users view any type of content (articles, papers, books)

BEGIN;

-- Create unified content views table
CREATE TABLE IF NOT EXISTS public.content_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  content_type text NOT NULL CHECK (content_type IN ('article', 'paper', 'book', 'insight')),
  content_id bigint NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  view_duration integer DEFAULT 0, -- in seconds, for future use
  UNIQUE(user_id, content_type, content_id) -- Prevent duplicate views
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_content_views_user_type_viewed 
ON public.content_views(user_id, content_type, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_views_user_recent 
ON public.content_views(user_id, viewed_at DESC);

-- Enable RLS
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can insert their own views" ON public.content_views;
DROP POLICY IF EXISTS "Users can view their own views" ON public.content_views;

CREATE POLICY "Users can insert their own views" ON public.content_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own views" ON public.content_views
  FOR SELECT USING (auth.uid() = user_id);

-- Function to record a view (upsert to handle duplicates)
CREATE OR REPLACE FUNCTION public.record_content_view(
  p_user_id uuid,
  p_content_type text,
  p_content_id bigint,
  p_view_duration integer DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.content_views (user_id, content_type, content_id, view_duration)
  VALUES (p_user_id, p_content_type, p_content_id, p_view_duration)
  ON CONFLICT (user_id, content_type, content_id) 
  DO UPDATE SET 
    viewed_at = now(),
    view_duration = GREATEST(content_views.view_duration, p_view_duration);
END;$$;

GRANT EXECUTE ON FUNCTION public.record_content_view(uuid, text, bigint, integer) TO authenticated;

-- Function to get recently viewed content for quiz system
CREATE OR REPLACE FUNCTION public.get_recently_viewed_content(
  p_user_id uuid,
  p_limit integer DEFAULT 15
) RETURNS TABLE (
  content_type text,
  content_id bigint,
  viewed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT cv.content_type, cv.content_id, cv.viewed_at
  FROM public.content_views cv
  WHERE cv.user_id = p_user_id
    AND cv.content_type IN ('article', 'paper', 'book') -- Exclude insights from quiz
  ORDER BY cv.viewed_at DESC
  LIMIT p_limit;
END;$$;

GRANT EXECUTE ON FUNCTION public.get_recently_viewed_content(uuid, integer) TO authenticated;

COMMIT;