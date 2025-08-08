-- SQL helper functions for hybrid search

-- 1. Full-text keyword search function
CREATE OR REPLACE FUNCTION keyword_search(query_text text, match_count int)
RETURNS TABLE(id bigint, content_type text, title text, summary text, authors text[], site_name text, date date, industry_id uuid, created_at timestamptz, score float) AS $$
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

-- 2. Semantic vector search function
CREATE OR REPLACE FUNCTION vector_search(query_embedding vector(384), match_threshold float, match_count int)
RETURNS TABLE(id bigint, content_type text, title text, summary text, authors text[], site_name text, date date, industry_id uuid, created_at timestamptz, score float) AS $$
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
            1 - (a.embedding <=> query_embedding) AS score
        FROM articles a
        WHERE 1 - (a.embedding <=> query_embedding) > match_threshold
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
            1 - (p.embedding <=> query_embedding) AS score
        FROM papers p
        WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
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
            1 - (b.embedding <=> query_embedding) AS score
        FROM books b
        WHERE 1 - (b.embedding <=> query_embedding) > match_threshold
    )
    SELECT *
    FROM vector_results
    ORDER BY score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
