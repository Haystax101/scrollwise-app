-- Database Migration: Add View Tracking
-- Run these commands in your Supabase SQL editor

-- 1. Create article_views table to track individual user views
CREATE TABLE IF NOT EXISTS article_views (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Unique constraint to ensure one view per user per article
  UNIQUE(user_id, article_id)
);

-- 2. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_article_views_user_id ON article_views(user_id);
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_created_at ON article_views(created_at);

-- 3. Add views_count column to articles table if not already added
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS views_count BIGINT DEFAULT 0;

-- 4. Create function to increment view count
CREATE OR REPLACE FUNCTION increment_article_view_count(article_id_param INTEGER, user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  view_exists BOOLEAN;
BEGIN
  -- Check if view already exists
  SELECT EXISTS(
    SELECT 1 FROM article_views 
    WHERE article_id = article_id_param AND user_id = user_id_param
  ) INTO view_exists;
  
  -- If view doesn't exist, add it and increment count
  IF NOT view_exists THEN
    -- Insert new view record
    INSERT INTO article_views (user_id, article_id) 
    VALUES (user_id_param, article_id_param);
    
    -- Increment views count in articles table
    UPDATE articles 
    SET views_count = views_count + 1 
    WHERE id = article_id_param;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to get article view count
CREATE OR REPLACE FUNCTION get_article_view_count(article_id_param INTEGER)
RETURNS BIGINT AS $$
DECLARE
  view_count BIGINT;
BEGIN
  SELECT views_count INTO view_count
  FROM articles 
  WHERE id = article_id_param;
  
  RETURN COALESCE(view_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to check if user has viewed an article
CREATE OR REPLACE FUNCTION has_user_viewed_article(article_id_param INTEGER, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM article_views 
    WHERE article_id = article_id_param AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Add RLS policies for article_views table
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all article views" ON article_views;
DROP POLICY IF EXISTS "Users can manage their own article views" ON article_views;

-- Allow users to view all article views (for count display)
CREATE POLICY "Users can view all article views" ON article_views
FOR SELECT USING (true);

-- Allow users to manage their own article views
CREATE POLICY "Users can manage their own article views" ON article_views
FOR ALL USING (auth.uid() = user_id);

-- 8. Update existing articles to have correct view counts (run once)
UPDATE articles 
SET views_count = (
  SELECT COUNT(*) 
  FROM article_views 
  WHERE article_views.article_id = articles.id
)
WHERE views_count IS NULL OR views_count = 0;

-- 9. Create trigger to automatically update views_count when article_views changes
CREATE OR REPLACE FUNCTION update_article_views_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update views count when a view is added or removed
  IF TG_OP = 'INSERT' THEN
    UPDATE articles 
    SET views_count = views_count + 1 
    WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE articles 
    SET views_count = GREATEST(views_count - 1, 0) 
    WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on article_views table
DROP TRIGGER IF EXISTS article_views_count_trigger ON article_views;
CREATE TRIGGER article_views_count_trigger
  AFTER INSERT OR DELETE ON article_views
  FOR EACH ROW
  EXECUTE FUNCTION update_article_views_count();

-- 10. Add helpful view for getting article stats
CREATE OR REPLACE VIEW article_stats AS
SELECT 
  a.id,
  a.title,
  a.likes_count,
  a.saves_count,
  a.comments_count,
  a.views_count,
  a.created_at,
  a.industry_id
FROM articles a
ORDER BY a.views_count DESC, a.created_at DESC;

-- 11. Update search function to include views_count
CREATE OR REPLACE FUNCTION search_articles(
  search_query text,
  industry_filter smallint DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id integer,
  title text,
  content text,
  authors text[],
  link text,
  created_at timestamp with time zone,
  type text,
  industry_id smallint,
  likes_count bigint,
  saves_count bigint,
  comments_count bigint,
  views_count bigint,
  site_name text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.content,
    a.authors,
    a.link,
    a.created_at,
    a.type,
    a.industry_id,
    a.likes_count,
    a.saves_count,
    a.comments_count,
    a.views_count,
    a.site_name,
    ts_rank(a.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM articles a
  WHERE 
    a.search_vector @@ plainto_tsquery('english', search_query)
    AND (industry_filter IS NULL OR a.industry_id = industry_filter)
  ORDER BY rank DESC, a.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql; 