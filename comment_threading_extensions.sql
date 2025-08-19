-- Comment Threading and Likes System Extensions
-- Based on 2025 best practices for scalable comment systems (Instagram/TikTok pattern)
-- Using self-referential foreign key pattern with optimized indexing

-- 1. Add parent_comment_id for comment threading (self-referential foreign key pattern)
ALTER TABLE public.insight_comments 
ADD COLUMN parent_comment_id uuid REFERENCES public.insight_comments(id) ON DELETE CASCADE;

-- 2. Add likes_count column (if not already added from database_extensions.sql)
-- This may already exist from previous database_extensions.sql
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'insight_comments' AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE public.insight_comments ADD COLUMN likes_count bigint NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 3. Add reply_count for each comment to track direct replies
ALTER TABLE public.insight_comments 
ADD COLUMN reply_count bigint NOT NULL DEFAULT 0;

-- 4. Add depth level for efficient querying (0 = root comment, 1 = first level reply, etc.)
ALTER TABLE public.insight_comments 
ADD COLUMN depth_level integer NOT NULL DEFAULT 0;

-- 5. Create insight_comment_likes table (if not already created from database_extensions.sql)
-- This may already exist from previous database_extensions.sql
CREATE TABLE IF NOT EXISTS public.insight_comment_likes (
  user_id uuid NOT NULL,
  comment_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insight_comment_likes_pkey PRIMARY KEY (user_id, comment_id),
  CONSTRAINT insight_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.insight_comments(id) ON DELETE CASCADE,
  CONSTRAINT insight_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 6. Create optimized indexes for threading queries
CREATE INDEX IF NOT EXISTS idx_insight_comments_parent_id ON public.insight_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_insight_comments_depth_level ON public.insight_comments(depth_level);
CREATE INDEX IF NOT EXISTS idx_insight_comments_insight_parent ON public.insight_comments(insight_id, parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_insight_comments_created_desc ON public.insight_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insight_comments_likes_desc ON public.insight_comments(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_insight_comment_likes_comment_id ON public.insight_comment_likes(comment_id);

-- 7. Create function to update comment counts automatically
CREATE OR REPLACE FUNCTION update_insight_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update parent comment's reply count
    IF NEW.parent_comment_id IS NOT NULL THEN
      UPDATE public.insight_comments 
      SET reply_count = reply_count + 1 
      WHERE id = NEW.parent_comment_id;
    END IF;
    
    -- Update insight's comment count
    UPDATE public.insights 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.insight_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Update parent comment's reply count
    IF OLD.parent_comment_id IS NOT NULL THEN
      UPDATE public.insight_comments 
      SET reply_count = GREATEST(reply_count - 1, 0) 
      WHERE id = OLD.parent_comment_id;
    END IF;
    
    -- Update insight's comment count
    UPDATE public.insights 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.insight_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to update comment likes count
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

-- 9. Create triggers for automatic count updates
DROP TRIGGER IF EXISTS trigger_insight_comment_counts ON public.insight_comments;
CREATE TRIGGER trigger_insight_comment_counts
  AFTER INSERT OR DELETE ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION update_insight_comment_counts();

DROP TRIGGER IF EXISTS trigger_insight_comment_likes_count ON public.insight_comment_likes;
CREATE TRIGGER trigger_insight_comment_likes_count
  AFTER INSERT OR DELETE ON public.insight_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_insight_comment_likes_count();

-- 10. Create function to get threaded comments (Instagram/TikTok style)
CREATE OR REPLACE FUNCTION get_threaded_comments(p_insight_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  insight_id uuid,
  parent_comment_id uuid,
  content text,
  created_at timestamp with time zone,
  likes_count bigint,
  reply_count bigint,
  depth_level integer,
  user_name text,
  user_avatar text
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- Get root comments (depth 0)
    SELECT 
      c.id, c.user_id, c.insight_id, c.parent_comment_id, c.content, c.created_at, 
      c.likes_count, c.reply_count, c.depth_level,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      c.created_at as sort_date
    FROM public.insight_comments c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.insight_id = p_insight_id AND c.parent_comment_id IS NULL
    
    UNION ALL
    
    -- Get replies (depth > 0)
    SELECT 
      c.id, c.user_id, c.insight_id, c.parent_comment_id, c.content, c.created_at,
      c.likes_count, c.reply_count, c.depth_level,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      ct.sort_date -- Maintain parent's sort order
    FROM public.insight_comments c
    JOIN public.profiles p ON c.user_id = p.id
    JOIN comment_tree ct ON c.parent_comment_id = ct.id
    WHERE c.depth_level <= 3 -- Limit depth to 3 levels like Instagram
  )
  SELECT ct.id, ct.user_id, ct.insight_id, ct.parent_comment_id, ct.content, ct.created_at,
         ct.likes_count, ct.reply_count, ct.depth_level, ct.user_name, ct.user_avatar
  FROM comment_tree ct
  ORDER BY ct.sort_date DESC, ct.depth_level ASC, ct.likes_count DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to add a threaded reply
CREATE OR REPLACE FUNCTION add_comment_reply(
  p_user_id uuid,
  p_insight_id uuid,
  p_parent_comment_id uuid,
  p_content text
) RETURNS uuid AS $$
DECLARE
  parent_depth integer;
  new_comment_id uuid;
BEGIN
  -- Get parent comment depth
  SELECT depth_level INTO parent_depth 
  FROM public.insight_comments 
  WHERE id = p_parent_comment_id;
  
  -- Limit depth to 3 levels (like Instagram/TikTok)
  IF parent_depth >= 3 THEN
    RAISE EXCEPTION 'Maximum reply depth exceeded';
  END IF;
  
  -- Insert new reply
  INSERT INTO public.insight_comments (user_id, insight_id, parent_comment_id, content, depth_level)
  VALUES (p_user_id, p_insight_id, p_parent_comment_id, p_content, parent_depth + 1)
  RETURNING id INTO new_comment_id;
  
  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Update existing counts to match current data
UPDATE public.insight_comments 
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.insight_comment_likes 
  WHERE comment_id = insight_comments.id
);

UPDATE public.insight_comments 
SET reply_count = (
  SELECT COUNT(*) 
  FROM public.insight_comments replies 
  WHERE replies.parent_comment_id = insight_comments.id
);

-- 13. Add constraint to prevent replies to deeply nested comments
ALTER TABLE public.insight_comments 
ADD CONSTRAINT check_max_depth CHECK (depth_level <= 3);

-- Performance notes:
-- This schema follows Instagram/TikTok patterns with:
-- 1. Self-referential foreign keys for threading
-- 2. Depth limiting (max 3 levels)
-- 3. Optimized indexes for common query patterns  
-- 4. Automatic count maintenance via triggers
-- 5. Recursive CTE function for efficient thread fetching
-- 6. Reply count tracking for UI optimization