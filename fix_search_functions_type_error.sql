-- Fix for search function type mismatch error
-- Changes DECIMAL to DOUBLE PRECISION in return types to match actual PostgreSQL function returns
-- Must drop functions first when changing return types

BEGIN;

-- Drop existing functions first (required when changing return types)
DROP FUNCTION IF EXISTS search_companies(TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS search_occupations(TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS search_mixed(TEXT, INTEGER);

-- Fix search_companies function
CREATE OR REPLACE FUNCTION search_companies(
  query_text TEXT,
  result_limit INTEGER DEFAULT 10,
  country_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  industry_sector TEXT,
  country_code TEXT,
  employee_count_range TEXT,
  relevance_score DOUBLE PRECISION,
  match_type TEXT
) AS $$
DECLARE
  normalized_query TEXT;
  tsquery_obj TSQUERY;
BEGIN
  -- Normalize query
  normalized_query := normalize_text(query_text);
  
  -- Return empty if query too short
  IF length(normalized_query) < 2 THEN
    RETURN;
  END IF;
  
  -- Create tsquery for full-text search (for longer queries)
  IF length(normalized_query) >= 3 THEN
    tsquery_obj := plainto_tsquery('simple', normalized_query);
  END IF;
  
  RETURN QUERY
  WITH search_results AS (
    -- Exact prefix matches (highest priority)
    SELECT DISTINCT
      c.id,
      c.name,
      c.industry_sector,
      c.country_code,
      c.employee_count_range,
      (1.0 + (c.popularity_score::DOUBLE PRECISION / 100))::DOUBLE PRECISION as score,
      'exact_prefix' as match_type
    FROM companies c
    WHERE c.status = 'active'
      AND c.name_normalized LIKE normalized_query || '%'
      AND (country_filter IS NULL OR c.country_code = country_filter)
    
    UNION ALL
    
    -- Alt names prefix matches
    SELECT DISTINCT
      c.id,
      c.name,
      c.industry_sector,
      c.country_code,
      c.employee_count_range,
      (0.9 + (c.popularity_score::DOUBLE PRECISION / 100))::DOUBLE PRECISION as score,
      'alt_name_prefix' as match_type
    FROM companies c
    WHERE c.status = 'active'
      AND EXISTS (
        SELECT 1 FROM unnest(c.alt_names) AS alt_name
        WHERE normalize_text(alt_name) LIKE normalized_query || '%'
      )
      AND (country_filter IS NULL OR c.country_code = country_filter)
    
    UNION ALL
    
    -- Fuzzy matches using pg_trgm (for typos)
    SELECT DISTINCT
      c.id,
      c.name,
      c.industry_sector,
      c.country_code,
      c.employee_count_range,
      (0.6 + similarity(c.name_normalized, normalized_query) + (c.popularity_score::DOUBLE PRECISION / 200))::DOUBLE PRECISION as score,
      'fuzzy' as match_type
    FROM companies c
    WHERE c.status = 'active'
      AND c.name_normalized % normalized_query
      AND similarity(c.name_normalized, normalized_query) > 0.3
      AND (country_filter IS NULL OR c.country_code = country_filter)
    
    UNION ALL
    
    -- Full-text search (for longer, more complex queries)
    SELECT DISTINCT
      c.id,
      c.name,
      c.industry_sector,
      c.country_code,
      c.employee_count_range,
      (0.4 + ts_rank(c.search_vector, tsquery_obj) + (c.popularity_score::DOUBLE PRECISION / 200))::DOUBLE PRECISION as score,
      'fulltext' as match_type
    FROM companies c
    WHERE c.status = 'active'
      AND tsquery_obj IS NOT NULL
      AND c.search_vector @@ tsquery_obj
      AND (country_filter IS NULL OR c.country_code = country_filter)
  )
  SELECT DISTINCT ON (sr.id)
    sr.id,
    sr.name,
    sr.industry_sector,
    sr.country_code,
    sr.employee_count_range,
    sr.score as relevance_score,
    sr.match_type
  FROM search_results sr
  ORDER BY sr.id, sr.score DESC, sr.name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Fix search_occupations function
CREATE OR REPLACE FUNCTION search_occupations(
  query_text TEXT,
  result_limit INTEGER DEFAULT 10,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  salary_range_gbp TEXT,
  relevance_score DOUBLE PRECISION,
  match_type TEXT
) AS $$
DECLARE
  normalized_query TEXT;
  tsquery_obj TSQUERY;
BEGIN
  -- Normalize query
  normalized_query := normalize_text(query_text);
  
  -- Return empty if query too short
  IF length(normalized_query) < 2 THEN
    RETURN;
  END IF;
  
  -- Create tsquery for full-text search (for longer queries)
  IF length(normalized_query) >= 3 THEN
    tsquery_obj := plainto_tsquery('simple', normalized_query);
  END IF;
  
  RETURN QUERY
  WITH search_results AS (
    -- Exact prefix matches (highest priority)
    SELECT DISTINCT
      o.id,
      o.title,
      o.category,
      o.salary_range_gbp,
      (1.0 + (o.popularity_score::DOUBLE PRECISION / 100))::DOUBLE PRECISION as score,
      'exact_prefix' as match_type
    FROM occupations o
    WHERE o.title_normalized LIKE normalized_query || '%'
      AND (category_filter IS NULL OR o.category = category_filter)
    
    UNION ALL
    
    -- Alt titles prefix matches
    SELECT DISTINCT
      o.id,
      o.title,
      o.category,
      o.salary_range_gbp,
      (0.9 + (o.popularity_score::DOUBLE PRECISION / 100))::DOUBLE PRECISION as score,
      'alt_title_prefix' as match_type
    FROM occupations o
    WHERE EXISTS (
        SELECT 1 FROM unnest(o.alt_titles) AS alt_title
        WHERE normalize_text(alt_title) LIKE normalized_query || '%'
      )
      AND (category_filter IS NULL OR o.category = category_filter)
    
    UNION ALL
    
    -- Fuzzy matches using pg_trgm (for typos)
    SELECT DISTINCT
      o.id,
      o.title,
      o.category,
      o.salary_range_gbp,
      (0.6 + similarity(o.title_normalized, normalized_query) + (o.popularity_score::DOUBLE PRECISION / 200))::DOUBLE PRECISION as score,
      'fuzzy' as match_type
    FROM occupations o
    WHERE o.title_normalized % normalized_query
      AND similarity(o.title_normalized, normalized_query) > 0.3
      AND (category_filter IS NULL OR o.category = category_filter)
    
    UNION ALL
    
    -- Full-text search (for longer, more complex queries)
    SELECT DISTINCT
      o.id,
      o.title,
      o.category,
      o.salary_range_gbp,
      (0.4 + ts_rank(o.search_vector, tsquery_obj) + (o.popularity_score::DOUBLE PRECISION / 200))::DOUBLE PRECISION as score,
      'fulltext' as match_type
    FROM occupations o
    WHERE tsquery_obj IS NOT NULL
      AND o.search_vector @@ tsquery_obj
      AND (category_filter IS NULL OR o.category = category_filter)
  )
  SELECT DISTINCT ON (sr.id)
    sr.id,
    sr.title,
    sr.category,
    sr.salary_range_gbp,
    sr.score as relevance_score,
    sr.match_type
  FROM search_results sr
  ORDER BY sr.id, sr.score DESC, sr.title
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Fix search_mixed function
CREATE OR REPLACE FUNCTION search_mixed(
  query_text TEXT,
  result_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT, -- 'company' or 'occupation'
  category_or_industry TEXT,
  context TEXT,
  relevance_score DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  WITH company_results AS (
    SELECT 
      sc.id,
      sc.name,
      'company'::TEXT as type,
      sc.industry_sector as category_or_industry,
      CASE 
        WHEN sc.employee_count_range IS NOT NULL AND sc.country_code IS NOT NULL 
        THEN sc.employee_count_range || ' employees · ' || sc.country_code
        WHEN sc.country_code IS NOT NULL THEN sc.country_code
        ELSE ''
      END as context,
      sc.relevance_score
    FROM search_companies(query_text, result_limit / 2) sc
  ),
  occupation_results AS (
    SELECT 
      so.id,
      so.title as name,
      'occupation'::TEXT as type,
      so.category as category_or_industry,
      CASE 
        WHEN so.salary_range_gbp IS NOT NULL THEN 'Job Title · ' || so.salary_range_gbp
        ELSE 'Job Title'
      END as context,
      so.relevance_score
    FROM search_occupations(query_text, result_limit / 2) so
  ),
  combined_results AS (
    SELECT * FROM company_results
    UNION ALL
    SELECT * FROM occupation_results
  )
  SELECT 
    cr.id,
    cr.name,
    cr.type,
    cr.category_or_industry,
    cr.context,
    cr.relevance_score
  FROM combined_results cr
  ORDER BY cr.relevance_score DESC, cr.name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

COMMIT;