-- Universal Threading Architecture Extension
-- Applies Instagram/TikTok threading patterns to all content types
-- Builds on the proven insight_comments architecture

-- ========================================
-- ARTICLES THREADING EXTENSION
-- ========================================

-- Extend existing comments table (article comments)
ALTER TABLE public.comments 
ADD COLUMN parent_comment_id bigint REFERENCES public.comments(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD COLUMN likes_count bigint NOT NULL DEFAULT 0;

ALTER TABLE public.comments 
ADD COLUMN reply_count bigint NOT NULL DEFAULT 0;

ALTER TABLE public.comments 
ADD COLUMN depth_level integer NOT NULL DEFAULT 0;

-- Add views_count to articles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'views_count'
    ) THEN
        -- Articles already have views_count, but adding for completeness
        -- ALTER TABLE public.articles ADD COLUMN views_count bigint NOT NULL DEFAULT 0;
        NULL;
    END IF;
END $$;

-- Create article_comment_likes table
CREATE TABLE IF NOT EXISTS public.article_comment_likes (
  user_id uuid NOT NULL,
  comment_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT article_comment_likes_pkey PRIMARY KEY (user_id, comment_id),
  CONSTRAINT article_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE,
  CONSTRAINT article_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create article_views table  
CREATE TABLE IF NOT EXISTS public.article_views_enhanced (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT article_views_enhanced_pkey PRIMARY KEY (id),
  CONSTRAINT article_views_enhanced_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE,
  CONSTRAINT article_views_enhanced_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ========================================
-- PAPERS THREADING EXTENSION
-- ========================================

-- Extend paper_comments table
ALTER TABLE public.paper_comments 
ADD COLUMN parent_comment_id bigint REFERENCES public.paper_comments(id) ON DELETE CASCADE;

ALTER TABLE public.paper_comments 
ADD COLUMN likes_count bigint NOT NULL DEFAULT 0;

ALTER TABLE public.paper_comments 
ADD COLUMN reply_count bigint NOT NULL DEFAULT 0;

ALTER TABLE public.paper_comments 
ADD COLUMN depth_level integer NOT NULL DEFAULT 0;

-- Papers already have views_count, but ensure consistency
-- ALTER TABLE public.papers ADD COLUMN views_count bigint NOT NULL DEFAULT 0; -- Already exists

-- Create paper_comment_likes table
CREATE TABLE IF NOT EXISTS public.paper_comment_likes (
  user_id uuid NOT NULL,
  comment_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT paper_comment_likes_pkey PRIMARY KEY (user_id, comment_id),
  CONSTRAINT paper_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.paper_comments(id) ON DELETE CASCADE,
  CONSTRAINT paper_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- paper_views already exists, ensure consistency
-- Papers already have paper_views table

-- ========================================
-- BOOKS THREADING EXTENSION  
-- ========================================

-- Extend book_comments table
ALTER TABLE public.book_comments 
ADD COLUMN parent_comment_id bigint REFERENCES public.book_comments(id) ON DELETE CASCADE;

ALTER TABLE public.book_comments 
ADD COLUMN likes_count bigint NOT NULL DEFAULT 0;

ALTER TABLE public.book_comments 
ADD COLUMN reply_count bigint NOT NULL DEFAULT 0;

ALTER TABLE public.book_comments 
ADD COLUMN depth_level integer NOT NULL DEFAULT 0;

-- Books already have views_count
-- ALTER TABLE public.books ADD COLUMN views_count bigint NOT NULL DEFAULT 0; -- Already exists

-- Create book_comment_likes table
CREATE TABLE IF NOT EXISTS public.book_comment_likes (
  user_id uuid NOT NULL,
  comment_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT book_comment_likes_pkey PRIMARY KEY (user_id, comment_id),
  CONSTRAINT book_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.book_comments(id) ON DELETE CASCADE,
  CONSTRAINT book_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- book_views already exists

-- ========================================
-- UNIVERSAL INDEXES FOR PERFORMANCE
-- ========================================

-- Article comment indexes
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_depth_level ON public.comments(depth_level);
CREATE INDEX IF NOT EXISTS idx_comments_article_parent ON public.comments(article_id, parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_likes_desc ON public.comments(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_article_comment_likes_comment_id ON public.article_comment_likes(comment_id);

-- Paper comment indexes
CREATE INDEX IF NOT EXISTS idx_paper_comments_parent_id ON public.paper_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_paper_comments_depth_level ON public.paper_comments(depth_level);
CREATE INDEX IF NOT EXISTS idx_paper_comments_paper_parent ON public.paper_comments(paper_id, parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_paper_comments_likes_desc ON public.paper_comments(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_paper_comment_likes_comment_id ON public.paper_comment_likes(comment_id);

-- Book comment indexes
CREATE INDEX IF NOT EXISTS idx_book_comments_parent_id ON public.book_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_depth_level ON public.book_comments(depth_level);
CREATE INDEX IF NOT EXISTS idx_book_comments_book_parent ON public.book_comments(book_id, parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_likes_desc ON public.book_comments(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_book_comment_likes_comment_id ON public.book_comment_likes(comment_id);

-- ========================================
-- UNIVERSAL FUNCTIONS FOR ALL CONTENT TYPES
-- ========================================

-- Generic threaded comments function for articles
CREATE OR REPLACE FUNCTION get_threaded_article_comments(p_article_id integer, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE (
  id bigint,
  user_id uuid,
  article_id integer,
  parent_comment_id bigint,
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
      c.id, c.user_id, c.article_id, c.parent_comment_id, c.content, c.created_at, 
      c.likes_count, c.reply_count, c.depth_level,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      c.created_at as sort_date
    FROM public.comments c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.article_id = p_article_id AND c.parent_comment_id IS NULL
    
    UNION ALL
    
    -- Get replies (depth > 0)
    SELECT 
      c.id, c.user_id, c.article_id, c.parent_comment_id, c.content, c.created_at,
      c.likes_count, c.reply_count, c.depth_level,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      ct.sort_date
    FROM public.comments c
    JOIN public.profiles p ON c.user_id = p.id
    JOIN comment_tree ct ON c.parent_comment_id = ct.id
    WHERE c.depth_level <= 3
  )
  SELECT ct.id, ct.user_id, ct.article_id, ct.parent_comment_id, ct.content, ct.created_at,
         ct.likes_count, ct.reply_count, ct.depth_level, ct.user_name, ct.user_avatar
  FROM comment_tree ct
  ORDER BY ct.sort_date DESC, ct.depth_level ASC, ct.likes_count DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Generic threaded comments function for papers
CREATE OR REPLACE FUNCTION get_threaded_paper_comments(p_paper_id bigint, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE (
  id bigint,
  user_id uuid,
  paper_id bigint,
  parent_comment_id bigint,
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
    SELECT 
      c.id, c.user_id, c.paper_id, c.parent_comment_id, c.content, c.created_at, 
      c.likes_count, c.reply_count, c.depth_level,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      c.created_at as sort_date
    FROM public.paper_comments c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.paper_id = p_paper_id AND c.parent_comment_id IS NULL
    
    UNION ALL
    
    SELECT 
      c.id, c.user_id, c.paper_id, c.parent_comment_id, c.content, c.created_at,
      c.likes_count, c.reply_count, c.depth_level,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      ct.sort_date
    FROM public.paper_comments c
    JOIN public.profiles p ON c.user_id = p.id
    JOIN comment_tree ct ON c.parent_comment_id = ct.id
    WHERE c.depth_level <= 3
  )
  SELECT ct.id, ct.user_id, ct.paper_id, ct.parent_comment_id, ct.content, ct.created_at,
         ct.likes_count, ct.reply_count, ct.depth_level, ct.user_name, ct.user_avatar
  FROM comment_tree ct
  ORDER BY ct.sort_date DESC, ct.depth_level ASC, ct.likes_count DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Generic threaded comments function for books
CREATE OR REPLACE FUNCTION get_threaded_book_comments(p_book_id bigint, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE (
  id bigint,
  user_id uuid,
  book_id bigint,
  parent_comment_id bigint,
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
    SELECT 
      c.id, c.user_id, c.book_id, c.parent_comment_id, c.content, c.created_at, 
      c.likes_count, c.reply_count, c.depth_level,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      c.created_at as sort_date
    FROM public.book_comments c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.book_id = p_book_id AND c.parent_comment_id IS NULL
    
    UNION ALL
    
    SELECT 
      c.id, c.user_id, c.book_id, c.parent_comment_id, c.content, c.created_at,
      c.likes_count, c.reply_count, c.depth_level,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      ct.sort_date
    FROM public.book_comments c
    JOIN public.profiles p ON c.user_id = p.id
    JOIN comment_tree ct ON c.parent_comment_id = ct.id
    WHERE c.depth_level <= 3
  )
  SELECT ct.id, ct.user_id, ct.book_id, ct.parent_comment_id, ct.content, ct.created_at,
         ct.likes_count, ct.reply_count, ct.depth_level, ct.user_name, ct.user_avatar
  FROM comment_tree ct
  ORDER BY ct.sort_date DESC, ct.depth_level ASC, ct.likes_count DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- UNIVERSAL REPLY CREATION FUNCTIONS
-- ========================================

-- Add article comment reply
CREATE OR REPLACE FUNCTION add_article_comment_reply(
  p_user_id uuid,
  p_article_id integer,
  p_parent_comment_id bigint,
  p_content text
) RETURNS bigint AS $$
DECLARE
  parent_depth integer;
  new_comment_id bigint;
BEGIN
  SELECT depth_level INTO parent_depth 
  FROM public.comments 
  WHERE id = p_parent_comment_id;
  
  IF parent_depth >= 3 THEN
    RAISE EXCEPTION 'Maximum reply depth exceeded';
  END IF;
  
  INSERT INTO public.comments (user_id, article_id, parent_comment_id, content, depth_level)
  VALUES (p_user_id, p_article_id, p_parent_comment_id, p_content, parent_depth + 1)
  RETURNING id INTO new_comment_id;
  
  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql;

-- Add paper comment reply
CREATE OR REPLACE FUNCTION add_paper_comment_reply(
  p_user_id uuid,
  p_paper_id bigint,
  p_parent_comment_id bigint,
  p_content text
) RETURNS bigint AS $$
DECLARE
  parent_depth integer;
  new_comment_id bigint;
BEGIN
  SELECT depth_level INTO parent_depth 
  FROM public.paper_comments 
  WHERE id = p_parent_comment_id;
  
  IF parent_depth >= 3 THEN
    RAISE EXCEPTION 'Maximum reply depth exceeded';
  END IF;
  
  INSERT INTO public.paper_comments (user_id, paper_id, parent_comment_id, content, depth_level)
  VALUES (p_user_id, p_paper_id, p_parent_comment_id, p_content, parent_depth + 1)
  RETURNING id INTO new_comment_id;
  
  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql;

-- Add book comment reply
CREATE OR REPLACE FUNCTION add_book_comment_reply(
  p_user_id uuid,
  p_book_id bigint,
  p_parent_comment_id bigint,
  p_content text
) RETURNS bigint AS $$
DECLARE
  parent_depth integer;
  new_comment_id bigint;
BEGIN
  SELECT depth_level INTO parent_depth 
  FROM public.book_comments 
  WHERE id = p_parent_comment_id;
  
  IF parent_depth >= 3 THEN
    RAISE EXCEPTION 'Maximum reply depth exceeded';
  END IF;
  
  INSERT INTO public.book_comments (user_id, book_id, parent_comment_id, content, depth_level)
  VALUES (p_user_id, p_book_id, p_parent_comment_id, p_content, parent_depth + 1)
  RETURNING id INTO new_comment_id;
  
  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- UNIVERSAL TRIGGER FUNCTIONS  
-- ========================================

-- Article comment count maintenance
CREATE OR REPLACE FUNCTION update_article_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_comment_id IS NOT NULL THEN
      UPDATE public.comments 
      SET reply_count = reply_count + 1 
      WHERE id = NEW.parent_comment_id;
    END IF;
    
    UPDATE public.articles 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.article_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.parent_comment_id IS NOT NULL THEN
      UPDATE public.comments 
      SET reply_count = GREATEST(reply_count - 1, 0) 
      WHERE id = OLD.parent_comment_id;
    END IF;
    
    UPDATE public.articles 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.article_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Paper comment count maintenance
CREATE OR REPLACE FUNCTION update_paper_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_comment_id IS NOT NULL THEN
      UPDATE public.paper_comments 
      SET reply_count = reply_count + 1 
      WHERE id = NEW.parent_comment_id;
    END IF;
    
    UPDATE public.papers 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.paper_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.parent_comment_id IS NOT NULL THEN
      UPDATE public.paper_comments 
      SET reply_count = GREATEST(reply_count - 1, 0) 
      WHERE id = OLD.parent_comment_id;
    END IF;
    
    UPDATE public.papers 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.paper_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Book comment count maintenance
CREATE OR REPLACE FUNCTION update_book_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_comment_id IS NOT NULL THEN
      UPDATE public.book_comments 
      SET reply_count = reply_count + 1 
      WHERE id = NEW.parent_comment_id;
    END IF;
    
    UPDATE public.books 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.book_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.parent_comment_id IS NOT NULL THEN
      UPDATE public.book_comments 
      SET reply_count = GREATEST(reply_count - 1, 0) 
      WHERE id = OLD.parent_comment_id;
    END IF;
    
    UPDATE public.books 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.book_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Comment likes count functions
CREATE OR REPLACE FUNCTION update_article_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_paper_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.paper_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.paper_comments 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_book_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.book_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.book_comments 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE ALL TRIGGERS
-- ========================================

-- Article triggers
DROP TRIGGER IF EXISTS trigger_article_comment_counts ON public.comments;
CREATE TRIGGER trigger_article_comment_counts
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_article_comment_counts();

DROP TRIGGER IF EXISTS trigger_article_comment_likes_count ON public.article_comment_likes;
CREATE TRIGGER trigger_article_comment_likes_count
  AFTER INSERT OR DELETE ON public.article_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_article_comment_likes_count();

-- Paper triggers
DROP TRIGGER IF EXISTS trigger_paper_comment_counts ON public.paper_comments;
CREATE TRIGGER trigger_paper_comment_counts
  AFTER INSERT OR DELETE ON public.paper_comments
  FOR EACH ROW EXECUTE FUNCTION update_paper_comment_counts();

DROP TRIGGER IF EXISTS trigger_paper_comment_likes_count ON public.paper_comment_likes;
CREATE TRIGGER trigger_paper_comment_likes_count
  AFTER INSERT OR DELETE ON public.paper_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_paper_comment_likes_count();

-- Book triggers
DROP TRIGGER IF EXISTS trigger_book_comment_counts ON public.book_comments;
CREATE TRIGGER trigger_book_comment_counts
  AFTER INSERT OR DELETE ON public.book_comments
  FOR EACH ROW EXECUTE FUNCTION update_book_comment_counts();

DROP TRIGGER IF EXISTS trigger_book_comment_likes_count ON public.book_comment_likes;
CREATE TRIGGER trigger_book_comment_likes_count
  AFTER INSERT OR DELETE ON public.book_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_book_comment_likes_count();

-- ========================================
-- ADD DEPTH CONSTRAINTS
-- ========================================

ALTER TABLE public.comments 
ADD CONSTRAINT check_max_depth_articles CHECK (depth_level <= 3);

ALTER TABLE public.paper_comments 
ADD CONSTRAINT check_max_depth_papers CHECK (depth_level <= 3);

ALTER TABLE public.book_comments 
ADD CONSTRAINT check_max_depth_books CHECK (depth_level <= 3);

-- ========================================
-- UPDATE EXISTING COUNTS
-- ========================================

-- Update existing article comment counts
UPDATE public.comments 
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.article_comment_likes 
  WHERE comment_id = comments.id
),
reply_count = (
  SELECT COUNT(*) 
  FROM public.comments replies 
  WHERE replies.parent_comment_id = comments.id
);

-- Update existing paper comment counts
UPDATE public.paper_comments 
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.paper_comment_likes 
  WHERE comment_id = paper_comments.id
),
reply_count = (
  SELECT COUNT(*) 
  FROM public.paper_comments replies 
  WHERE replies.parent_comment_id = paper_comments.id
);

-- Update existing book comment counts
UPDATE public.book_comments 
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.book_comment_likes 
  WHERE comment_id = book_comments.id
),
reply_count = (
  SELECT COUNT(*) 
  FROM public.book_comments replies 
  WHERE replies.parent_comment_id = book_comments.id
);

-- ========================================
-- BENEFITS OF THIS ARCHITECTURE
-- ========================================

/*
1. **Unified Experience**: All content types now have consistent threading
2. **Performance**: Same optimizations (indexes, triggers) across all tables
3. **Scalability**: Proven architecture extended to all content types
4. **Maintainability**: Common patterns and functions reduce complexity
5. **User Engagement**: Deeper conversations on all content types
6. **Modern UX**: Matches 2025 social media expectations everywhere
7. **Code Reuse**: Same CommentsModal component can handle all content types
8. **Data Integrity**: Automatic count maintenance prevents drift
9. **Future-Proof**: Easy to add new content types with same patterns
10. **Analytics**: Rich data for engagement analysis across all content
*/