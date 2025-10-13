-- Nuclear option: Drop ALL versions of search functions by OID
-- This removes every single overloaded version

-- First, let's see what we're dealing with
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all keyword_search functions
    FOR func_record IN
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'keyword_search'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_record.func_signature || ' CASCADE';
        RAISE NOTICE 'Dropped: %', func_record.func_signature;
    END LOOP;

    -- Drop all vector_search functions
    FOR func_record IN
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'vector_search'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_record.func_signature || ' CASCADE';
        RAISE NOTICE 'Dropped: %', func_record.func_signature;
    END LOOP;
END $$;

-- Now recreate keyword_search (single version)
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

-- Now recreate vector_search (single version)
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

-- Final verification
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('keyword_search', 'vector_search')
ORDER BY p.proname;

SELECT 'SUCCESS: Search functions cleaned and recreated' as status;
