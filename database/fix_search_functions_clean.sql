-- Clean up ALL versions of search functions and recreate
-- This fixes the "structure of query does not match function result type" error

-- Drop ALL versions of the functions (including overloaded versions)
DROP FUNCTION IF EXISTS keyword_search(text, integer) CASCADE;
DROP FUNCTION IF EXISTS vector_search(vector, float, integer) CASCADE;
DROP FUNCTION IF EXISTS vector_search(vector(384), float, integer) CASCADE;
DROP FUNCTION IF EXISTS vector_search(vector(384), double precision, integer) CASCADE;

-- Recreate keyword_search with correct signature
-- Note: "summary" in the return type is what the edge function expects
CREATE FUNCTION keyword_search(query_text text, match_count int)
RETURNS TABLE(
  id bigint,
  content_type text,
  title text,
  summary text,
  content_complex text,
  authors text[],
  site_name text,
  date date,
  industry_id uuid,
  created_at timestamptz,
  score float
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        'article'::text AS content_type,
        a.title,
        a.summary,
        NULL::text AS content_complex,
        ARRAY[a.author] AS authors,
        a.site_name,
        a.date,
        a.industry_id,
        a.created_at,
        ts_rank_cd(a.search_vector, websearch_to_tsquery('english', query_text))::float AS score
    FROM articles a
    WHERE a.search_vector @@ websearch_to_tsquery('english', query_text)

    UNION ALL

    SELECT
        p.id,
        'paper'::text AS content_type,
        p.title,
        p.content_simple AS summary,
        p.content_complex,
        p.authors,
        p.site_name,
        p.date,
        p.industry_id,
        p.created_at,
        ts_rank_cd(p.search_vector, websearch_to_tsquery('english', query_text))::float AS score
    FROM papers p
    WHERE p.search_vector @@ websearch_to_tsquery('english', query_text)

    UNION ALL

    SELECT
        b.id,
        'book'::text AS content_type,
        b.title,
        b.short_summary AS summary,
        NULL::text AS content_complex,
        ARRAY[b.author] AS authors,
        NULL::text AS site_name,
        TO_DATE(b.year::text, 'YYYY') AS date,
        b.industry_id,
        b.created_at,
        ts_rank_cd(b.search_vector, websearch_to_tsquery('english', query_text))::float AS score
    FROM books b
    WHERE b.search_vector @@ websearch_to_tsquery('english', query_text)

    ORDER BY score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Recreate vector_search with correct signature
CREATE FUNCTION vector_search(query_embedding vector(384), match_threshold float, match_count int)
RETURNS TABLE(
  id bigint,
  content_type text,
  title text,
  summary text,
  content_complex text,
  authors text[],
  site_name text,
  date date,
  industry_id uuid,
  created_at timestamptz,
  score float
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        'article'::text AS content_type,
        a.title,
        a.summary,
        NULL::text AS content_complex,
        ARRAY[a.author] AS authors,
        a.site_name,
        a.date,
        a.industry_id,
        a.created_at,
        (1 - (a.embedding <=> query_embedding))::float AS score
    FROM articles a
    WHERE (1 - (a.embedding <=> query_embedding)) > match_threshold

    UNION ALL

    SELECT
        p.id,
        'paper'::text AS content_type,
        p.title,
        p.content_simple AS summary,
        p.content_complex,
        p.authors,
        p.site_name,
        p.date,
        p.industry_id,
        p.created_at,
        (1 - (p.embedding <=> query_embedding))::float AS score
    FROM papers p
    WHERE (1 - (p.embedding <=> query_embedding)) > match_threshold

    UNION ALL

    SELECT
        b.id,
        'book'::text AS content_type,
        b.title,
        b.short_summary AS summary,
        NULL::text AS content_complex,
        ARRAY[b.author] AS authors,
        NULL::text AS site_name,
        TO_DATE(b.year::text, 'YYYY') AS date,
        b.industry_id,
        b.created_at,
        (1 - (b.embedding <=> query_embedding))::float AS score
    FROM books b
    WHERE (1 - (b.embedding <=> query_embedding)) > match_threshold

    ORDER BY score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Verify only one version of each function exists
SELECT
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('keyword_search', 'vector_search')
ORDER BY p.proname, p.oid;
