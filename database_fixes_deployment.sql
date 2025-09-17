-- Database Fixes Deployment
-- This file contains all the necessary database changes to fix the reported issues
-- Run this in your Supabase SQL editor

-- ==========================================
-- 1. Fix RLS Policies
-- ==========================================

-- Fix user_referrals RLS policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.user_referrals;
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
    FOR SELECT
    USING (
        auth.uid() = referrer_id OR
        auth.uid() = referred_user_id OR
        auth.uid() IN (
            SELECT id FROM profiles
            WHERE referral_code = user_referrals.referral_code
        )
    );

DROP POLICY IF EXISTS "Users can create referrals" ON public.user_referrals;
CREATE POLICY "Users can create referrals" ON public.user_referrals
    FOR INSERT
    WITH CHECK (
        auth.uid() = referrer_id OR
        referrer_id IS NULL
    );

DROP POLICY IF EXISTS "Users can update their own referrals" ON public.user_referrals;
CREATE POLICY "Users can update their own referrals" ON public.user_referrals
    FOR UPDATE
    USING (
        auth.uid() = referrer_id OR
        auth.uid() = referred_user_id
    )
    WITH CHECK (
        auth.uid() = referrer_id OR
        auth.uid() = referred_user_id
    );

-- Fix friendships RLS policies
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships" ON public.friendships
    FOR SELECT
    USING (
        auth.uid() = requester_id OR
        auth.uid() = addressee_id
    );

DROP POLICY IF EXISTS "Users can create friend requests" ON public.friendships;
CREATE POLICY "Users can create friend requests" ON public.friendships
    FOR INSERT
    WITH CHECK (
        auth.uid() = requester_id AND
        requester_id != addressee_id
    );

DROP POLICY IF EXISTS "Users can update their friendships" ON public.friendships;
CREATE POLICY "Users can update their friendships" ON public.friendships
    FOR UPDATE
    USING (
        auth.uid() = requester_id OR
        auth.uid() = addressee_id
    )
    WITH CHECK (
        auth.uid() = requester_id OR
        auth.uid() = addressee_id
    );

DROP POLICY IF EXISTS "Users can delete their own requests" ON public.friendships;
CREATE POLICY "Users can delete their own requests" ON public.friendships
    FOR DELETE
    USING (
        auth.uid() = requester_id OR
        auth.uid() = addressee_id
    );

-- Fix friend_suggestions RLS policies
DROP POLICY IF EXISTS "Users can view their own suggestions" ON public.friend_suggestions;
CREATE POLICY "Users can view their own suggestions" ON public.friend_suggestions
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create suggestions" ON public.friend_suggestions;
CREATE POLICY "System can create suggestions" ON public.friend_suggestions
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their suggestions" ON public.friend_suggestions;
CREATE POLICY "Users can update their suggestions" ON public.friend_suggestions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their suggestions" ON public.friend_suggestions;
CREATE POLICY "Users can delete their suggestions" ON public.friend_suggestions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_suggestions ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.user_referrals TO authenticated;
GRANT ALL ON public.friendships TO authenticated;
GRANT ALL ON public.friend_suggestions TO authenticated;

-- ==========================================
-- 2. Friend Suggestions RPC Function
-- ==========================================

-- Drop the function first if it exists
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
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
    -- Always generate fresh suggestions to ensure they exclude current friendships
    -- (Don't use cache because friendship status may have changed)
        -- Generate new suggestions based on various criteria
        -- First, clean up old suggestions
        DELETE FROM friend_suggestions
        WHERE user_id = p_user_id
        AND (dismissed_at IS NOT NULL OR created_at <= NOW() - INTERVAL '7 days');

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
                -- Exclude existing friendships (any status: pending, accepted, blocked, etc.)
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
            fs.id,
            fs.suggested_user_id,
            COALESCE(p.full_name, 'Unknown User') as full_name,
            fs.suggestion_score,
            fs.suggestion_reasons,
            fs.mutual_friends_count,
            fs.same_industry,
            COALESCE(p.avatar_url, '') as avatar_url,
            COALESCE(p.friends_count, 0) as friends_count
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

-- ==========================================
-- 3. Additional Debugging Views (Optional)
-- ==========================================

-- Create a view to help debug RLS issues
CREATE OR REPLACE VIEW debug_friendships AS
SELECT
    f.id,
    f.requester_id,
    f.addressee_id,
    f.status,
    f.created_at,
    req.full_name as requester_name,
    addr.full_name as addressee_name,
    auth.uid() as current_user_id,
    (auth.uid() = f.requester_id) as is_requester,
    (auth.uid() = f.addressee_id) as is_addressee
FROM friendships f
LEFT JOIN profiles req ON f.requester_id = req.id
LEFT JOIN profiles addr ON f.addressee_id = addr.id;

-- Grant access to the debug view
GRANT SELECT ON debug_friendships TO authenticated;