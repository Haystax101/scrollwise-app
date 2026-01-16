-- Search V2 RPC Function
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION search_content_v2(query_text text)
RETURNS TABLE (
  id text,
  type text,
  title text,
  subtitle text, -- source or author
  image_url text,
  colour text,
  date text,
  special boolean,
  match_score real
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH search_query AS (
    SELECT plainto_tsquery('english', query_text) as query
  )
  SELECT
    a.id::text,
    'article'::text as type,
    a.title,
    COALESCE(a.site_name, 'Unknown Source') as subtitle,
    a.image_url,
    a.colour,
    TO_CHAR(a.date, 'YYYY-MM-DD') as date,
    a.special,
    ts_rank(a.search_vector, sq.query)::real as match_score
  FROM public.articles a, search_query sq
  WHERE a.search_vector @@ sq.query
  
  UNION ALL
  
  SELECT
    p.id::text,
    'paper'::text as type,
    p.title,
    COALESCE(p.site_name, 'Unknown Source') as subtitle,
    NULL as image_url, -- Papers usually don't have cover images in this schema?
    NULL as colour,
    TO_CHAR(p.date, 'YYYY-MM-DD') as date,
    false as special,
    ts_rank(p.search_vector, sq.query)::real as match_score
  FROM public.papers p, search_query sq
  WHERE p.search_vector @@ sq.query

  UNION ALL

  SELECT
    b.id::text,
    'book'::text as type,
    b.title,
    b.author as subtitle,
    NULL as image_url,
    NULL as colour,
    b.year::text as date,
    false as special,
    ts_rank(b.search_vector, sq.query)::real as match_score
  FROM public.books b, search_query sq
  WHERE b.search_vector @@ sq.query

  UNION ALL

  SELECT
    v.id::text,
    'video'::text as type,
    v.title,
    COALESCE(v.site_name, 'Video Source') as subtitle,
    v.image_url,
    NULL as colour,
    TO_CHAR(v.date, 'YYYY-MM-DD') as date,
    false as special,
    ts_rank(v.search_vector, sq.query)::real as match_score
  FROM public.videos v, search_query sq
  WHERE v.search_vector @@ sq.query

  UNION ALL

  SELECT
    p.id::text,
    'podcast'::text as type,
    p.title,
    COALESCE(p.site_name, 'Podcast Source') as subtitle,
    p.image_url,
    NULL as colour,
    TO_CHAR(p.date, 'YYYY-MM-DD') as date,
    false as special,
    ts_rank(p.search_vector, sq.query)::real as match_score
  FROM public.podcasts p, search_query sq
  WHERE p.search_vector @@ sq.query

  ORDER BY match_score DESC
  LIMIT 7;
END;
$$;
