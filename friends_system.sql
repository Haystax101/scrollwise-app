-- Friends System Database Schema
-- This file implements a comprehensive friends system with referrals, suggestions, and social features

-- Step 1: Create enums for friendship and referral status
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friendship_status') THEN
        CREATE TYPE friendship_status AS ENUM (
            'pending',
            'accepted',
            'blocked',
            'declined'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN
        CREATE TYPE referral_status AS ENUM (
            'pending',     -- Invitation sent, not yet signed up
            'registered',  -- User signed up but hasn't completed onboarding
            'completed',   -- User completed onboarding
            'expired'      -- Referral link expired
        );
    END IF;
END $$;

-- Step 2: Replace connections table with comprehensive friendships table
DROP TABLE IF EXISTS public.connections CASCADE;

CREATE TABLE public.friendships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status friendship_status NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    connection_strength numeric DEFAULT 0 CHECK (connection_strength >= 0 AND connection_strength <= 1),
    mutual_friends_count integer DEFAULT 0,
    interaction_score numeric DEFAULT 0,

    -- Constraints
    CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id),
    CONSTRAINT friendships_no_self_reference CHECK (requester_id != addressee_id)
);

-- Step 3: Create indexes for friendship queries
CREATE INDEX idx_friendships_requester_status ON public.friendships(requester_id, status);
CREATE INDEX idx_friendships_addressee_status ON public.friendships(addressee_id, status);
CREATE INDEX idx_friendships_status_created ON public.friendships(status, created_at);
CREATE INDEX idx_friendships_connection_strength ON public.friendships(connection_strength DESC) WHERE status = 'accepted';

-- Step 4: Referral and invitation system
CREATE TABLE public.user_referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    referral_code varchar(20) UNIQUE NOT NULL,
    referred_email varchar(255),
    referred_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    status referral_status NOT NULL DEFAULT 'pending',
    shared_content_type varchar(50), -- 'article', 'paper', 'book', 'insight'
    shared_content_id varchar(100),
    referral_source varchar(50), -- 'ios_share', 'email', 'link'
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone,

    -- Reward tracking
    reward_given boolean DEFAULT false,
    reward_amount integer DEFAULT 0,

    CONSTRAINT referrals_valid_content CHECK (
        (shared_content_type IS NULL AND shared_content_id IS NULL) OR
        (shared_content_type IS NOT NULL AND shared_content_id IS NOT NULL)
    )
);

-- Indexes for referral queries
CREATE INDEX idx_referrals_referrer_status ON public.user_referrals(referrer_id, status);
CREATE INDEX idx_referrals_code ON public.user_referrals(referral_code);
CREATE INDEX idx_referrals_email ON public.user_referrals(referred_email) WHERE referred_user_id IS NULL;
CREATE INDEX idx_referrals_status_reward ON public.user_referrals(status, reward_given);

-- Step 5: Friend suggestions cache
CREATE TABLE public.friend_suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    suggested_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    suggestion_score numeric NOT NULL CHECK (suggestion_score >= 0 AND suggestion_score <= 1),
    suggestion_reasons jsonb DEFAULT '{}',
    mutual_friends_count integer DEFAULT 0,
    same_industry boolean DEFAULT false,
    interaction_history_score numeric DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    shown_at timestamp with time zone,
    dismissed_at timestamp with time zone,

    CONSTRAINT friend_suggestions_unique UNIQUE (user_id, suggested_user_id),
    CONSTRAINT friend_suggestions_no_self CHECK (user_id != suggested_user_id)
);

-- Indexes for friend suggestions
CREATE INDEX idx_friend_suggestions_user_score ON public.friend_suggestions(user_id, suggestion_score DESC)
    WHERE dismissed_at IS NULL;
CREATE INDEX idx_friend_suggestions_created ON public.friend_suggestions(created_at);

-- Step 6: Enhance profiles table with social features
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS friends_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS public_profile boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_friend_requests boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS discoverable boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS referral_code varchar(20) UNIQUE,
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{
    "discoverable": true,
    "allow_friend_requests": true,
    "show_mutual_friends": true,
    "show_in_suggestions": true,
    "public_friend_list": false
}';

-- Step 7: Create functions and triggers

-- Function to ensure bidirectional friendship uniqueness
CREATE OR REPLACE FUNCTION ensure_friendship_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if reverse friendship exists
    IF EXISTS (
        SELECT 1 FROM public.friendships
        WHERE requester_id = NEW.addressee_id
        AND addressee_id = NEW.requester_id
    ) THEN
        RAISE EXCEPTION 'Friendship relationship already exists in reverse direction';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friendship_uniqueness_trigger
    BEFORE INSERT ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION ensure_friendship_uniqueness();

-- Function to update friends count automatically
CREATE OR REPLACE FUNCTION update_friends_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update for both users in the friendship
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        -- Friendship accepted - increment both counts
        UPDATE public.profiles SET friends_count = friends_count + 1
        WHERE id = NEW.requester_id OR id = NEW.addressee_id;
    ELSIF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
        -- Friendship ended - decrement both counts
        UPDATE public.profiles SET friends_count = GREATEST(friends_count - 1, 0)
        WHERE id = NEW.requester_id OR id = NEW.addressee_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friendship_count_trigger
    AFTER UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION update_friends_count();

-- Function to prevent friend request spam
CREATE OR REPLACE FUNCTION prevent_friend_request_spam()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has sent too many requests recently
    IF (
        SELECT COUNT(*)
        FROM public.friendships
        WHERE requester_id = NEW.requester_id
        AND created_at > NOW() - INTERVAL '1 hour'
    ) > 20 THEN
        RAISE EXCEPTION 'Too many friend requests sent recently. Please try again later.';
    END IF;

    -- Check if addressee has blocked requester
    IF EXISTS (
        SELECT 1
        FROM public.friendships
        WHERE requester_id = NEW.addressee_id
        AND addressee_id = NEW.requester_id
        AND status = 'blocked'
    ) THEN
        RAISE EXCEPTION 'Cannot send friend request to user who has blocked you.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friend_request_spam_prevention
    BEFORE INSERT ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION prevent_friend_request_spam();

-- Step 8: Utility functions for friend operations

-- Get mutual friends between two users
CREATE OR REPLACE FUNCTION get_mutual_friends(user1_id uuid, user2_id uuid)
RETURNS TABLE(mutual_friend_id uuid, mutual_friend_name text) AS $$
BEGIN
    RETURN QUERY
    WITH user1_friends AS (
        SELECT CASE
            WHEN requester_id = user1_id THEN addressee_id
            ELSE requester_id
        END as friend_id
        FROM public.friendships
        WHERE (requester_id = user1_id OR addressee_id = user1_id)
        AND status = 'accepted'
    ),
    user2_friends AS (
        SELECT CASE
            WHEN requester_id = user2_id THEN addressee_id
            ELSE requester_id
        END as friend_id
        FROM public.friendships
        WHERE (requester_id = user2_id OR addressee_id = user2_id)
        AND status = 'accepted'
    )
    SELECT u1f.friend_id, p.full_name
    FROM user1_friends u1f
    JOIN user2_friends u2f ON u1f.friend_id = u2f.friend_id
    JOIN public.profiles p ON p.id = u1f.friend_id;
END;
$$ LANGUAGE plpgsql;

-- Friend suggestion algorithm
CREATE OR REPLACE FUNCTION generate_friend_suggestions(target_user_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE(
    suggested_user_id uuid,
    suggestion_score numeric,
    mutual_friends_count integer,
    same_industry boolean,
    full_name text,
    avatar_url text
) AS $$
BEGIN
    RETURN QUERY
    WITH current_user_industries AS (
        SELECT industry_id
        FROM public.user_industries
        WHERE user_id = target_user_id
    ),
    existing_friends AS (
        SELECT CASE
            WHEN requester_id = target_user_id THEN addressee_id
            ELSE requester_id
        END as friend_id
        FROM public.friendships
        WHERE (requester_id = target_user_id OR addressee_id = target_user_id)
        AND status IN ('accepted', 'pending')
    ),
    friend_of_friends AS (
        SELECT
            CASE
                WHEN f.requester_id = ef.friend_id THEN f.addressee_id
                ELSE f.requester_id
            END as potential_friend_id,
            COUNT(*) as mutual_count
        FROM existing_friends ef
        JOIN public.friendships f ON (f.requester_id = ef.friend_id OR f.addressee_id = ef.friend_id)
        WHERE f.status = 'accepted'
        AND CASE
            WHEN f.requester_id = ef.friend_id THEN f.addressee_id
            ELSE f.requester_id
        END NOT IN (SELECT friend_id FROM existing_friends)
        AND CASE
            WHEN f.requester_id = ef.friend_id THEN f.addressee_id
            ELSE f.requester_id
        END != target_user_id
        GROUP BY potential_friend_id
    ),
    industry_matches AS (
        SELECT
            p.id as potential_friend_id,
            0 as mutual_count,
            true as same_industry_match
        FROM public.profiles p
        JOIN public.user_industries ui ON ui.user_id = p.id
        JOIN current_user_industries cui ON cui.industry_id = ui.industry_id
        WHERE p.id != target_user_id
        AND p.id NOT IN (SELECT friend_id FROM existing_friends)
        AND p.allow_friend_requests = true
        AND p.discoverable = true
        AND (p.privacy_settings->>'show_in_suggestions')::boolean = true
    ),
    combined_suggestions AS (
        -- Friend of friends
        SELECT
            fof.potential_friend_id,
            fof.mutual_count,
            EXISTS(SELECT 1 FROM industry_matches im WHERE im.potential_friend_id = fof.potential_friend_id) as same_industry_match,
            -- Score: 70% mutual friends + 30% same industry
            (LEAST(fof.mutual_count::numeric / 5.0, 1.0) * 0.7) +
            (CASE WHEN EXISTS(SELECT 1 FROM industry_matches im WHERE im.potential_friend_id = fof.potential_friend_id)
             THEN 0.3 ELSE 0 END) as score
        FROM friend_of_friends fof

        UNION

        -- Same industry (only if not already in friend of friends)
        SELECT
            im.potential_friend_id,
            0 as mutual_count,
            true as same_industry_match,
            0.25 as score -- Lower score for industry-only matches
        FROM industry_matches im
        WHERE im.potential_friend_id NOT IN (SELECT potential_friend_id FROM friend_of_friends)
    )
    SELECT
        cs.potential_friend_id,
        LEAST(cs.score, 1.0)::numeric,
        cs.mutual_count,
        cs.same_industry_match,
        p.full_name,
        p.avatar_url
    FROM combined_suggestions cs
    JOIN public.profiles p ON p.id = cs.potential_friend_id
    ORDER BY cs.score DESC, cs.mutual_count DESC, p.full_name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to process referral rewards
CREATE OR REPLACE FUNCTION process_referral_rewards()
RETURNS void AS $$
DECLARE
    referral_record RECORD;
BEGIN
    -- Process completed referrals that haven't been rewarded
    FOR referral_record IN
        SELECT r.*, p.full_name as referrer_name
        FROM public.user_referrals r
        JOIN public.profiles p ON p.id = r.referrer_id
        WHERE r.status = 'completed'
        AND r.reward_given = false
        AND r.referrer_id IS NOT NULL
    LOOP
        -- Give voltz reward to referrer
        UPDATE public.profiles
        SET spendable_voltz = COALESCE(spendable_voltz, 0) + 50,
            total_voltz_earned = COALESCE(total_voltz_earned, 0) + 50
        WHERE id = referral_record.referrer_id;

        -- Mark reward as given
        UPDATE public.user_referrals
        SET reward_given = true,
            reward_amount = 50
        WHERE id = referral_record.id;

        -- Log the reward in voltz_transactions if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voltz_transactions') THEN
            INSERT INTO public.voltz_transactions (
                user_id, amount, transaction_type, description
            ) VALUES (
                referral_record.referrer_id,
                50,
                'referral_reward',
                'Friend referral reward'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Generate referral codes for existing users
CREATE OR REPLACE FUNCTION generate_referral_code(user_id uuid)
RETURNS varchar(20) AS $$
DECLARE
    code varchar(20);
    counter integer := 0;
BEGIN
    LOOP
        -- Generate a random 8-character code
        code := upper(substr(md5(random()::text || user_id::text || counter::text), 1, 8));

        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code)
           AND NOT EXISTS (SELECT 1 FROM public.user_referrals WHERE referral_code = code) THEN
            RETURN code;
        END IF;

        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique referral code after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing users with referral codes
UPDATE public.profiles
SET referral_code = generate_referral_code(id)
WHERE referral_code IS NULL;

-- Step 10: Create materialized view for friend analytics (optional, for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS friend_network_stats AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) FILTER (WHERE status = 'pending') as requests_sent,
    COUNT(*) FILTER (WHERE status = 'accepted') as friendships_formed,
    COUNT(*) FILTER (WHERE status = 'declined') as requests_declined,
    COUNT(*) FILTER (WHERE status = 'blocked') as users_blocked,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'accepted')::numeric /
        NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'declined'))::numeric, 0) * 100,
        2
    ) as acceptance_rate
FROM public.friendships
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_friend_network_stats_date ON friend_network_stats(date);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW friend_network_stats;

-- Step 11: Row Level Security (RLS) policies

-- Enable RLS on friendships table
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view friendships they're involved in
CREATE POLICY "Users can view their friendships" ON public.friendships
    FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Policy: Users can insert friend requests they initiate
CREATE POLICY "Users can send friend requests" ON public.friendships
    FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

-- Policy: Users can update friendships they're involved in
CREATE POLICY "Users can update their friendships" ON public.friendships
    FOR UPDATE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Enable RLS on friend suggestions
ALTER TABLE public.friend_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own suggestions
CREATE POLICY "Users can view their friend suggestions" ON public.friend_suggestions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: System can insert suggestions for users
CREATE POLICY "System can create friend suggestions" ON public.friend_suggestions
    FOR INSERT
    WITH CHECK (true); -- This will be controlled by application logic

-- Enable RLS on user referrals
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view referrals they created or were referred by
CREATE POLICY "Users can view their referrals" ON public.user_referrals
    FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Policy: Users can create referrals
CREATE POLICY "Users can create referrals" ON public.user_referrals
    FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

-- Final: Create a function to clean up old friend suggestions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_friend_suggestions()
RETURNS void AS $$
BEGIN
    -- Remove suggestions older than 30 days that were dismissed
    DELETE FROM public.friend_suggestions
    WHERE dismissed_at IS NOT NULL
    AND dismissed_at < NOW() - INTERVAL '30 days';

    -- Remove very old suggestions that were never shown
    DELETE FROM public.friend_suggestions
    WHERE shown_at IS NULL
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.friendships TO authenticated;
GRANT ALL ON public.friend_suggestions TO authenticated;
GRANT ALL ON public.user_referrals TO authenticated;
GRANT SELECT ON public.friend_network_stats TO authenticated;