-- Database extensions to support insight comments likes and views
-- This adds missing functionality to match the pattern used by articles, papers, and books

-- 1. Add likes_count to insight_comments (like book_comments, paper_comments don't have it, but we want it)
ALTER TABLE public.insight_comments 
ADD COLUMN likes_count bigint NOT NULL DEFAULT 0;

-- 2. Add views_count to insights table (articles, papers, books have it)
ALTER TABLE public.insights 
ADD COLUMN views_count bigint NOT NULL DEFAULT 0;

-- 3. Create insight_comment_likes table (following the pattern of other entities)
CREATE TABLE public.insight_comment_likes (
  user_id uuid NOT NULL,
  comment_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insight_comment_likes_pkey PRIMARY KEY (user_id, comment_id),
  CONSTRAINT insight_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.insight_comments(id) ON DELETE CASCADE,
  CONSTRAINT insight_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 4. Create insight_views table (following the pattern of article_views, paper_views, book_views)
CREATE TABLE public.insight_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  insight_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT insight_views_pkey PRIMARY KEY (id),
  CONSTRAINT insight_views_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id) ON DELETE CASCADE,
  CONSTRAINT insight_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 5. Add indexes for performance (following the pattern of other tables)
CREATE INDEX idx_insight_comment_likes_comment_id ON public.insight_comment_likes(comment_id);
CREATE INDEX idx_insight_comment_likes_user_id ON public.insight_comment_likes(user_id);
CREATE INDEX idx_insight_views_insight_id ON public.insight_views(insight_id);
CREATE INDEX idx_insight_views_user_id ON public.insight_views(user_id);
CREATE INDEX idx_insight_comments_likes_count ON public.insight_comments(likes_count);

-- 6. Optional: Add triggers to automatically update counts (like other tables might have)
-- This ensures likes_count and views_count stay in sync

-- Trigger function to update insight_comments.likes_count
CREATE OR REPLACE FUNCTION update_insight_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.insight_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.insight_comments 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update insights.views_count
CREATE OR REPLACE FUNCTION update_insight_views_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.insights 
    SET views_count = views_count + 1 
    WHERE id = NEW.insight_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.insights 
    SET views_count = GREATEST(views_count - 1, 0) 
    WHERE id = OLD.insight_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_insight_comment_likes_count
  AFTER INSERT OR DELETE ON public.insight_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_insight_comment_likes_count();

CREATE TRIGGER trigger_update_insight_views_count
  AFTER INSERT OR DELETE ON public.insight_views
  FOR EACH ROW EXECUTE FUNCTION update_insight_views_count();

-- 7. Update existing counts to match current data (run once after creating tables)
-- Update insight_comments.likes_count based on existing data
UPDATE public.insight_comments 
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.insight_comment_likes 
  WHERE comment_id = insight_comments.id
);

-- Update insights.views_count based on existing data  
UPDATE public.insights 
SET views_count = (
  SELECT COUNT(*) 
  FROM public.insight_views 
  WHERE insight_id = insights.id
);