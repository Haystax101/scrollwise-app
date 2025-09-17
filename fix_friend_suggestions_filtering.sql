-- Fix Friend Suggestions RPC Function Filtering Issue
-- Problem: RPC function returns users who already have pending friend requests
-- Cause: Existing suggestions aren't fully cleared before generating new ones

-- Drop and recreate the function with proper suggestion cleanup
DROP FUNCTION IF EXISTS generate_friend_suggestions(uuid, integer);

CREATE FUNCTION generate_friend_suggestions(
    p_user_id uuid,
    p_limit integer DEFAULT 10
)
RETURNS TABLE (
    suggestion_id uuid,
    suggested_user_id uuid,
    full_name text,
    suggestion_score numeric,
    suggestion_reasons jsonb,
    mutual_friends_count integer,
    same_industry boolean,
    avatar_url text,
    friends_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
    -- Always generate fresh suggestions to ensure they exclude current friendships
    -- CRITICAL FIX: Delete ALL existing suggestions for this user, not just old/dismissed ones
    DELETE FROM friend_suggestions
    WHERE user_id = p_user_id;

    -- Log for debugging: Show filtering stats
    RAISE NOTICE 'Generating suggestions for user %, found % total users, % existing friendships',
        p_user_id,
        (SELECT COUNT(*) FROM profiles WHERE id != p_user_id AND discoverable = true AND allow_friend_requests = true),
        (SELECT COUNT(*) FROM friendships WHERE requester_id = p_user_id OR addressee_id = p_user_id);

    -- Insert new suggestions based on overlapping industries
    INSERT INTO friend_suggestions (
        user_id,
        suggested_user_id,
        suggestion_score,
        suggestion_reasons,
        same_industry,
        mutual_friends_count
    )
    WITH user_industries_list AS (
        -- Get all industries for the current user
        SELECT industry_id FROM user_industries WHERE user_id = p_user_id
    ),
    suggested_users_with_overlap AS (
        SELECT
            p.id as suggested_user_id,
            p.full_name,
            p.avatar_url,
            p.friends_count,
            -- Count overlapping industries
            COUNT(ui.industry_id) as overlapping_industries,
            -- Collect overlapping industry names
            array_agg(i.name) as overlapping_industry_names
        FROM profiles p
        JOIN user_industries ui ON p.id = ui.user_id
        JOIN user_industries_list uil ON ui.industry_id = uil.industry_id
        LEFT JOIN industries i ON ui.industry_id = i.id
        WHERE p.id != p_user_id
            AND p.discoverable = true
            AND p.allow_friend_requests = true
            -- CRITICAL: Exclude existing friendships (any status: pending, accepted, blocked, etc.)
            AND NOT EXISTS (
                SELECT 1 FROM friendships f
                WHERE (f.requester_id = p_user_id AND f.addressee_id = p.id)
                   OR (f.requester_id = p.id AND f.addressee_id = p_user_id)
            )
            -- Only suggest active users (have some activity in last 30 days)
            AND EXISTS (
                SELECT 1 FROM content_views cv
                WHERE cv.user_id = p.id
                AND cv.viewed_at > NOW() - INTERVAL '30 days'
            )
        GROUP BY p.id, p.full_name, p.avatar_url, p.friends_count
        HAVING COUNT(ui.industry_id) > 0 -- At least one overlapping industry
    )
    SELECT
        p_user_id as user_id,
        swo.suggested_user_id,
        -- Score based on number of overlapping industries (0.5 to 1.0)
        LEAST(1.0, 0.5 + (swo.overlapping_industries * 0.1))::numeric as suggestion_score,
        -- Build reasons array with industry count
        jsonb_build_array(
            CASE
                WHEN swo.overlapping_industries = 1 THEN '1 shared industry'
                ELSE swo.overlapping_industries || ' shared industries'
            END
        ) as suggestion_reasons,
        (swo.overlapping_industries > 0) as same_industry,
        0 as mutual_friends_count
    FROM suggested_users_with_overlap swo
    ORDER BY
        swo.overlapping_industries DESC, -- Most overlapping industries first
        swo.friends_count DESC, -- Then by popularity
        RANDOM() -- Add some randomness for variety
    LIMIT p_limit * 2; -- Generate more than needed for better selection

    -- Now return the generated suggestions
    RETURN QUERY
    SELECT
        fs.id::uuid,
        fs.suggested_user_id::uuid,
        COALESCE(p.full_name, 'Unknown User')::text as full_name,
        fs.suggestion_score::numeric,
        fs.suggestion_reasons::jsonb,
        fs.mutual_friends_count::integer,
        fs.same_industry::boolean,
        COALESCE(p.avatar_url, '')::text as avatar_url,
        COALESCE(p.friends_count, 0)::integer as friends_count
    FROM friend_suggestions fs
    JOIN profiles p ON fs.suggested_user_id = p.id
    WHERE fs.user_id = p_user_id
        AND fs.dismissed_at IS NULL
    ORDER BY fs.suggestion_score DESC, COALESCE(p.friends_count, 0) DESC
    LIMIT p_limit;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_friend_suggestions(uuid, integer) TO authenticated;