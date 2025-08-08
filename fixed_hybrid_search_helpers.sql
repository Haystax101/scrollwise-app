-- Fixed SQL helper functions for hybrid search

-- 1. Fixed full-text keyword search function (corrected type mismatch)
CREATE OR REPLACE FUNCTION keyword_search(query_text text, match_count int)
RETURNS TABLE(id bigint, content_type text, title text, summary text, authors text[], site_name text, date date, industry_id uuid, created_at timestamptz, score real) AS $$
BEGIN
    RETURN QUERY
    WITH full_text_results AS (
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
            ts_rank_cd(a.search_vector, websearch_to_tsquery('english', query_text)) AS score
        FROM articles a
        WHERE a.search_vector @@ websearch_to_tsquery('english', query_text)
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
            ts_rank_cd(p.search_vector, websearch_to_tsquery('english', query_text)) AS score
        FROM papers p
        WHERE p.search_vector @@ websearch_to_tsquery('english', query_text)
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
            ts_rank_cd(b.search_vector, websearch_to_tsquery('english', query_text)) AS score
        FROM books b
        WHERE b.search_vector @@ websearch_to_tsquery('english', query_text)
    )
    SELECT *
    FROM full_text_results
    ORDER BY score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 2. Fixed semantic vector search function (aligned return type)
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

-- 3. Create the missing combined_content view for fallback search
CREATE OR REPLACE VIEW combined_content AS
SELECT 
    id,
    'article' as content_type,
    title,
    summary,
    ARRAY[author] as authors,
    site_name,
    date,
    industry_id,
    created_at,
    likes_count,
    saves_count,
    comments_count,
    views_count,
    link
FROM articles
WHERE author IS NOT NULL
UNION ALL
SELECT 
    id,
    'paper' as content_type,
    title,
    content_simple as summary,
    authors,
    site_name,
    date,
    industry_id,
    created_at,
    likes_count,
    saves_count,
    comments_count,
    views_count,
    link
FROM papers
UNION ALL
SELECT 
    id,
    'book' as content_type,
    title,
    short_summary as summary,
    ARRAY[author] as authors,
    NULL as site_name,
    CASE 
        WHEN year IS NOT NULL THEN TO_DATE(year::text, 'YYYY')
        ELSE NULL
    END as date,
    industry_id,
    created_at,
    likes_count,
    saves_count,
    comments_count,
    views_count,
    NULL as link
FROM books
WHERE author IS NOT NULL;