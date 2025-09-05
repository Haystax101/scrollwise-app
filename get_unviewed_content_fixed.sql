-- Fixed RPC function to get unviewed content directly from database
-- Based on actual schema from databaseOverview.sql

-- Drop the function first if it exists (required for Supabase)
DROP FUNCTION IF EXISTS get_unviewed_content_by_type(uuid, text, uuid[], int);

CREATE FUNCTION get_unviewed_content_by_type(
    p_user_id uuid,
    p_content_type text,
    p_industry_ids uuid[] DEFAULT NULL,
    p_limit int DEFAULT 10
)
RETURNS TABLE (
    id text,
    title text,
    content text,
    author text,
    authors text[],
    summary text,
    content_simple text,
    content_complex text,
    short_summary text,
    key_insights text[],
    year int,
    date timestamp with time zone,
    created_at timestamp with time zone,
    link text,
    site_name text,
    industry_id uuid,
    likes_count int,
    saves_count int,
    comments_count int,
    views_count int,
    author_id uuid,
    full_name text,
    avatar_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Handle insights separately (no industry filtering, includes profile data)
    IF p_content_type = 'insight' THEN
        RETURN QUERY
        SELECT 
            i.id::text,
            i.content as title,
            i.content,
            '' as author,
            NULL::text[] as authors,
            '' as summary,
            '' as content_simple,
            '' as content_complex,
            '' as short_summary,
            NULL::text[] as key_insights,
            NULL::int as year,
            i.created_at as date,
            i.created_at,
            ('#insight-' || i.id::text) as link,
            '' as site_name,
            NULL::uuid as industry_id,
            COALESCE(i.likes_count, 0)::int as likes_count,
            COALESCE(i.saves_count, 0)::int as saves_count,
            COALESCE(i.comments_count, 0)::int as comments_count,
            COALESCE(i.views_count, 0)::int as views_count,
            i.author_id,
            COALESCE(p.full_name, '') as full_name,
            COALESCE(p.avatar_url, '') as avatar_url
        FROM insights i
        LEFT JOIN profiles p ON i.author_id = p.id
        WHERE i.author_id != p_user_id
        AND NOT EXISTS (
            SELECT 1 FROM content_views cv 
            WHERE cv.user_id = p_user_id 
            AND cv.content_type = 'insight' 
            AND cv.content_id = i.id::text
        )
        ORDER BY i.created_at DESC
        LIMIT p_limit;
    
    -- Handle articles (id=integer, has date field)
    ELSIF p_content_type = 'article' THEN
        RETURN QUERY
        SELECT 
            a.id::text,
            a.title,
            '' as content,
            COALESCE(a.author, '') as author,
            NULL::text[] as authors,
            a.summary,
            '' as content_simple,
            '' as content_complex,
            '' as short_summary,
            NULL::text[] as key_insights,
            NULL::int as year,
            COALESCE(a.date::timestamp with time zone, a.created_at) as date,
            a.created_at,
            a.link,
            COALESCE(a.site_name, '') as site_name,
            a.industry_id,
            COALESCE(a.likes_count, 0)::int as likes_count,
            COALESCE(a.saves_count, 0)::int as saves_count,
            COALESCE(a.comments_count, 0)::int as comments_count,
            COALESCE(a.views_count, 0)::int as views_count,
            NULL::uuid as author_id,
            '' as full_name,
            '' as avatar_url
        FROM articles a
        WHERE (p_industry_ids IS NULL OR a.industry_id = ANY(p_industry_ids))
        AND NOT EXISTS (
            SELECT 1 FROM content_views cv 
            WHERE cv.user_id = p_user_id 
            AND cv.content_type = 'article' 
            AND cv.content_id = a.id::text
        )
        ORDER BY a.created_at DESC
        LIMIT p_limit;
    
    -- Handle papers (id=bigint, has date field)
    ELSIF p_content_type = 'paper' THEN
        RETURN QUERY
        SELECT 
            p.id::text,
            p.title,
            '' as content,
            '' as author,
            p.authors,
            '' as summary,
            p.content_simple,
            p.content_complex,
            '' as short_summary,
            NULL::text[] as key_insights,
            NULL::int as year,
            COALESCE(p.date::timestamp with time zone, p.created_at) as date,
            p.created_at,
            p.link,
            COALESCE(p.site_name, '') as site_name,
            p.industry_id,
            COALESCE(p.likes_count, 0)::int as likes_count,
            COALESCE(p.saves_count, 0)::int as saves_count,
            COALESCE(p.comments_count, 0)::int as comments_count,
            COALESCE(p.views_count, 0)::int as views_count,
            NULL::uuid as author_id,
            '' as full_name,
            '' as avatar_url
        FROM papers p
        WHERE (p_industry_ids IS NULL OR p.industry_id = ANY(p_industry_ids))
        AND NOT EXISTS (
            SELECT 1 FROM content_views cv 
            WHERE cv.user_id = p_user_id 
            AND cv.content_type = 'paper' 
            AND cv.content_id = p.id::text
        )
        ORDER BY p.created_at DESC
        LIMIT p_limit;
    
    -- Handle books (id=bigint, no date/link/site_name fields)
    ELSIF p_content_type = 'book' THEN
        RETURN QUERY
        SELECT 
            b.id::text,
            b.title,
            '' as content,
            b.author,
            NULL::text[] as authors,
            '' as summary,
            '' as content_simple,
            '' as content_complex,
            b.short_summary,
            b.key_insights,
            b.year,
            b.created_at as date,
            b.created_at,
            '' as link,
            '' as site_name,
            b.industry_id,
            COALESCE(b.likes_count, 0)::int as likes_count,
            COALESCE(b.saves_count, 0)::int as saves_count,
            COALESCE(b.comments_count, 0)::int as comments_count,
            COALESCE(b.views_count, 0)::int as views_count,
            NULL::uuid as author_id,
            '' as full_name,
            '' as avatar_url
        FROM books b
        WHERE (p_industry_ids IS NULL OR b.industry_id = ANY(p_industry_ids))
        AND NOT EXISTS (
            SELECT 1 FROM content_views cv 
            WHERE cv.user_id = p_user_id 
            AND cv.content_type = 'book' 
            AND cv.content_id = b.id::text
        )
        ORDER BY b.created_at DESC
        LIMIT p_limit;
    
    END IF;
END;
$$;