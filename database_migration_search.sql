-- Full-text search setup for articles table
-- Add search vector column to articles table
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Create indexes for performance
CREATE INDEX articles_search_vector_idx ON articles USING gin(search_vector);
CREATE INDEX articles_title_idx ON articles USING gin(to_tsvector('english', title));
CREATE INDEX articles_content_idx ON articles USING gin(to_tsvector('english', content));

-- Function to update search vector automatically
CREATE OR REPLACE FUNCTION update_articles_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.authors, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.type, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector on insert/update
CREATE TRIGGER articles_search_vector_trigger
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_search_vector();

-- Update existing records (run this once to populate search vectors for existing articles)
UPDATE articles SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(authors, ' '), '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(type, '')), 'D');

-- Drop any existing search_articles functions to avoid conflicts
DROP FUNCTION IF EXISTS search_articles(text, integer, integer, integer);
DROP FUNCTION IF EXISTS search_articles(text, smallint, integer, integer);

-- Search function for articles
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

-- Search suggestions function
CREATE OR REPLACE FUNCTION get_article_search_suggestions(
  partial_query text,
  limit_count integer DEFAULT 5
)
RETURNS TABLE(suggestion text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    regexp_split_to_table(title, '\s+') as suggestion
  FROM articles
  WHERE title ILIKE partial_query || '%'
  ORDER BY suggestion
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Search analytics table (optional - for tracking popular searches)
CREATE TABLE IF NOT EXISTS search_analytics (
  id SERIAL PRIMARY KEY,
  query text NOT NULL,
  user_id uuid REFERENCES profiles(id),
  results_count integer,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Function to log searches
CREATE OR REPLACE FUNCTION log_search(
  search_query text,
  user_id uuid DEFAULT NULL,
  results_count integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO search_analytics (query, user_id, results_count)
  VALUES (search_query, user_id, results_count);
END;
$$ LANGUAGE plpgsql; 