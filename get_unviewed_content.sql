-- Efficient RPC function to get unviewed content directly from database
-- This excludes content that exists in content_views at the SQL level

CREATE OR REPLACE FUNCTION get_unviewed_content_by_type(
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
    updated_at timestamp with time zone,
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
            i.updated_at,
            ('#insight-' || i.id::text) as link,
            '' as site_name,
            NULL::uuid as industry_id,
            COALESCE(i.likes_count, 0) as likes_count,
            0 as saves_count,
            COALESCE(i.comments_count, 0) as comments_count,
            COALESCE(i.views_count, 0) as views_count,
            i.author_id,
            p.full_name,
            p.avatar_url
        FROM insights i
        LEFT JOIN profiles p ON i.author_id = p.id
        WHERE i.author_id != p_user_id
        AND NOT EXISTS (
            SELECT 1 FROM content_views cv 
            WHERE cv.user_id = p_user_id 
            AND cv.content_type = 'insight' 
            AND cv.content_id::text = i.id::text
        )
        ORDER BY i.created_at DESC
        LIMIT p_limit;
    
    -- Handle articles
    ELSIF p_content_type = 'article' THEN
        RETURN QUERY
        SELECT 
            a.id::text,
            a.title,
            '' as content,
            a.author,
            NULL::text[] as authors,
            a.summary,
            '' as content_simple,
            '' as content_complex,
            '' as short_summary,
            NULL::text[] as key_insights,
            NULL::int as year,
            a.date,
            a.created_at,
            a.updated_at,
            a.link,
            a.site_name,
            a.industry_id,
            COALESCE(a.likes_count, 0) as likes_count,
            COALESCE(a.saves_count, 0) as saves_count,
            COALESCE(a.comments_count, 0) as comments_count,
            COALESCE(a.views_count, 0) as views_count,
            NULL::uuid as author_id,
            '' as full_name,
            '' as avatar_url
        FROM articles a
        WHERE (p_industry_ids IS NULL OR a.industry_id = ANY(p_industry_ids))
        AND NOT EXISTS (
            SELECT 1 FROM content_views cv 
            WHERE cv.user_id = p_user_id 
            AND cv.content_type = 'article' 
            AND cv.content_id = a.id::bigint
        )
        ORDER BY a.created_at DESC
        LIMIT p_limit;
    
    -- Handle papers
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
            p.date,
            p.created_at,
            p.updated_at,
            p.link,
            p.site_name,
            p.industry_id,
            COALESCE(p.likes_count, 0) as likes_count,
            COALESCE(p.saves_count, 0) as saves_count,
            COALESCE(p.comments_count, 0) as comments_count,
            COALESCE(p.views_count, 0) as views_count,
            NULL::uuid as author_id,
            '' as full_name,
            '' as avatar_url
        FROM papers p
        WHERE (p_industry_ids IS NULL OR p.industry_id = ANY(p_industry_ids))
        AND NOT EXISTS (
            SELECT 1 FROM content_views cv 
            WHERE cv.user_id = p_user_id 
            AND cv.content_type = 'paper' 
            AND cv.content_id = p.id::bigint
        )
        ORDER BY p.created_at DESC
        LIMIT p_limit;
    
    -- Handle books
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
            b.date,
            b.created_at,
            b.updated_at,
            b.link,
            b.site_name,
            b.industry_id,
            COALESCE(b.likes_count, 0) as likes_count,
            COALESCE(b.saves_count, 0) as saves_count,
            COALESCE(b.comments_count, 0) as comments_count,
            COALESCE(b.views_count, 0) as views_count,
            NULL::uuid as author_id,
            '' as full_name,
            '' as avatar_url
        FROM books b
        WHERE (p_industry_ids IS NULL OR b.industry_id = ANY(p_industry_ids))
        AND NOT EXISTS (
            SELECT 1 FROM content_views cv 
            WHERE cv.user_id = p_user_id 
            AND cv.content_type = 'book' 
            AND cv.content_id = b.id::bigint
        )
        ORDER BY b.created_at DESC
        LIMIT p_limit;
    
    END IF;
END;
$$;