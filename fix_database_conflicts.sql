-- Fix database function conflicts and add pro_plan field

-- 1. Drop existing conflicting vector_search functions
DROP FUNCTION IF EXISTS vector_search(vector, double precision, integer);
DROP FUNCTION IF EXISTS vector_search(vector, real, integer);
DROP FUNCTION IF EXISTS vector_search(vector, float, integer);

-- 2. Create single vector_search function with consistent types
CREATE OR REPLACE FUNCTION vector_search(query_embedding vector(384), match_threshold real, match_count int)
RETURNS TABLE(id bigint, content_type text, title text, summary text, authors text[], site_name text, date date, industry_id uuid, created_at timestamptz, score real) AS $$
BEGIN
    RETURN QUERY
    WITH vector_results AS (
        SELECT
            a.id,
            'article' AS content_type,
            a.title,
            a.summary,
            ARRAY[a.author] AS authors,
            a.site_name,
            a.date,
            a.industry_id,
            a.created_at,
            (1 - (a.embedding <=> query_embedding))::real AS score
        FROM articles a
        WHERE a.embedding IS NOT NULL 
        AND (1 - (a.embedding <=> query_embedding)) > match_threshold
        UNION ALL
        SELECT
            p.id,
            'paper' AS content_type,
            p.title,
            p.content_simple AS summary,
            p.authors,
            p.site_name,
            p.date,
            p.industry_id,
            p.created_at,
            (1 - (p.embedding <=> query_embedding))::real AS score
        FROM papers p
        WHERE p.embedding IS NOT NULL 
        AND (1 - (p.embedding <=> query_embedding)) > match_threshold
        UNION ALL
        SELECT
            b.id,
            'book' AS content_type,
            b.title,
            b.short_summary AS summary,
            ARRAY[b.author] AS authors,
            NULL AS site_name,
            TO_DATE(b.year::text, 'YYYY') AS date,
            b.industry_id,
            b.created_at,
            (1 - (b.embedding <=> query_embedding))::real AS score
        FROM books b
        WHERE b.embedding IS NOT NULL 
        AND (1 - (b.embedding <=> query_embedding)) > match_threshold
    )
    SELECT *
    FROM vector_results
    ORDER BY score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Add pro_plan field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pro_plan boolean NOT NULL DEFAULT false;

-- 4. Create index for faster queries on pro_plan
CREATE INDEX IF NOT EXISTS idx_profiles_pro_plan ON profiles(pro_plan);

-- 5. Verify the functions exist and work correctly
-- Test keyword search
-- SELECT * FROM keyword_search('test', 3);

-- Test vector search (with dummy embedding)
-- SELECT * FROM vector_search(array_fill(0.0, ARRAY[384])::vector, 0.5, 3);