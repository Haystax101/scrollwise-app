-- RPC for General Feed (FYP)
-- Returns rich posts from ANY public community.
-- Excludes "messages" (chat).

CREATE OR REPLACE FUNCTION get_general_community_feed(
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    type text,
    content text,
    title text,
    media_urls text[],
    user_id uuid,
    created_at timestamp with time zone,
    author_name text,
    author_avatar text,
    community_id uuid,
    community_name text,
    community_avatar text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        'post' as type,
        p.content,
        p.title,
        p.media_urls,
        p.user_id,
        p.created_at,
        pr.full_name as author_name,
        pr.avatar_url as author_avatar,
        c.id as community_id,
        c.name as community_name,
        c.avatar_url as community_avatar
    FROM public.community_posts p
    JOIN public.profiles pr ON p.user_id = pr.id
    JOIN public.communities c ON p.community_id = c.id
    WHERE c.privacy_level = 'public'
    ORDER BY p.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$;
