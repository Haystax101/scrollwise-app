-- Friend Suggestions RPC Function
-- This function generates friend suggestions for a user based on various criteria

-- Drop the function first if it exists (required for Supabase)
DROP FUNCTION IF EXISTS generate_friend_suggestions(uuid, integer);

CREATE FUNCTION generate_friend_suggestions(
    p_user_id uuid,
    p_limit integer DEFAULT 10
)
RETURNS TABLE (
    id uuid,
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
AS $$
BEGIN
    -- Check if user has existing suggestions that are still valid (not dismissed, created within last 7 days)
    IF EXISTS (
        SELECT 1 FROM friend_suggestions fs
        WHERE fs.user_id = p_user_id
        AND fs.dismissed_at IS NULL
        AND fs.created_at > NOW() - INTERVAL '7 days'
    ) THEN
        -- Return existing suggestions
        RETURN QUERY
        SELECT
            fs.id,
            fs.suggested_user_id,
            p.full_name,
            fs.suggestion_score,
            fs.suggestion_reasons,
            fs.mutual_friends_count,
            fs.same_industry,
            p.avatar_url,
            p.friends_count
        FROM friend_suggestions fs
        JOIN profiles p ON fs.suggested_user_id = p.id
        WHERE fs.user_id = p_user_id
            AND fs.dismissed_at IS NULL
            AND fs.created_at > NOW() - INTERVAL '7 days'
        ORDER BY fs.suggestion_score DESC
        LIMIT p_limit;
    ELSE
        -- Generate new suggestions based on various criteria
        -- First, clean up old suggestions
        DELETE FROM friend_suggestions
        WHERE user_id = p_user_id
        AND (dismissed_at IS NOT NULL OR created_at <= NOW() - INTERVAL '7 days');

        -- Insert new suggestions based on industry matches
        INSERT INTO friend_suggestions (
            user_id,
            suggested_user_id,
            suggestion_score,
            suggestion_reasons,
            same_industry,
            mutual_friends_count
        )
        SELECT
            p_user_id,
            p.id,
            CASE
                WHEN ui_user.industry_id = ui_suggested.industry_id THEN 0.8
                ELSE 0.3
            END as suggestion_score,
            jsonb_build_array(
                CASE WHEN ui_user.industry_id = ui_suggested.industry_id
                     THEN 'Same industry'
                     ELSE 'Active user'
                END
            ) as suggestion_reasons,
            (ui_user.industry_id = ui_suggested.industry_id) as same_industry,
            0 as mutual_friends_count
        FROM profiles p
        LEFT JOIN user_industries ui_suggested ON p.id = ui_suggested.user_id
        LEFT JOIN user_industries ui_user ON p_user_id = ui_user.user_id
        WHERE p.id != p_user_id
            AND p.discoverable = true
            AND p.allow_friend_requests = true
            -- Exclude existing friends
            AND NOT EXISTS (
                SELECT 1 FROM friendships f
                WHERE (f.requester_id = p_user_id AND f.addressee_id = p.id)
                   OR (f.requester_id = p.id AND f.addressee_id = p_user_id)
            )
            -- Exclude already suggested users
            AND NOT EXISTS (
                SELECT 1 FROM friend_suggestions fs
                WHERE fs.user_id = p_user_id AND fs.suggested_user_id = p.id
                AND fs.dismissed_at IS NULL
            )
            -- Only suggest active users (have some activity in last 30 days)
            AND EXISTS (
                SELECT 1 FROM content_views cv
                WHERE cv.user_id = p.id
                AND cv.viewed_at > NOW() - INTERVAL '30 days'
            )
        ORDER BY
            CASE WHEN ui_user.industry_id = ui_suggested.industry_id THEN 1 ELSE 0 END DESC,
            p.friends_count DESC,
            p.created_at DESC
        LIMIT p_limit * 2; -- Generate more than needed for better selection

        -- Now return the generated suggestions
        RETURN QUERY
        SELECT
            fs.id,
            fs.suggested_user_id,
            p.full_name,
            fs.suggestion_score,
            fs.suggestion_reasons,
            fs.mutual_friends_count,
            fs.same_industry,
            p.avatar_url,
            p.friends_count
        FROM friend_suggestions fs
        JOIN profiles p ON fs.suggested_user_id = p.id
        WHERE fs.user_id = p_user_id
            AND fs.dismissed_at IS NULL
        ORDER BY fs.suggestion_score DESC, p.friends_count DESC
        LIMIT p_limit;
    END IF;
END;
$$;