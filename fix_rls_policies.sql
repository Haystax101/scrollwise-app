-- Fix RLS Policies for Friends System and Referrals
-- This file fixes the Row Level Security policies that are causing permission issues

-- 1. Fix user_referrals RLS policies
-- First, check current policies and drop if they exist
DROP POLICY IF EXISTS "Users can view their referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can update their referrals" ON public.user_referrals;

-- Create proper RLS policies for user_referrals
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

CREATE POLICY "Users can create referrals" ON public.user_referrals
    FOR INSERT
    WITH CHECK (
        auth.uid() = referrer_id OR
        referrer_id IS NULL
    );

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

-- 2. Fix friendships RLS policies for proper CRUD operations
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete friendships" ON public.friendships;

-- Create comprehensive RLS policies for friendships
CREATE POLICY "Users can view their friendships" ON public.friendships
    FOR SELECT
    USING (
        auth.uid() = requester_id OR
        auth.uid() = addressee_id
    );

CREATE POLICY "Users can create friend requests" ON public.friendships
    FOR INSERT
    WITH CHECK (
        auth.uid() = requester_id AND
        requester_id != addressee_id
    );

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

CREATE POLICY "Users can delete their own requests" ON public.friendships
    FOR DELETE
    USING (
        auth.uid() = requester_id OR
        auth.uid() = addressee_id
    );

-- 3. Fix friend_suggestions RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their suggestions" ON public.friend_suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON public.friend_suggestions;
DROP POLICY IF EXISTS "Users can update suggestions" ON public.friend_suggestions;
DROP POLICY IF EXISTS "Users can delete suggestions" ON public.friend_suggestions;

-- Create RLS policies for friend_suggestions
CREATE POLICY "Users can view their own suggestions" ON public.friend_suggestions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create suggestions" ON public.friend_suggestions
    FOR INSERT
    WITH CHECK (true); -- Allow system/functions to create suggestions

CREATE POLICY "Users can update their suggestions" ON public.friend_suggestions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their suggestions" ON public.friend_suggestions
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Ensure RLS is enabled on all tables
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_suggestions ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions
GRANT ALL ON public.user_referrals TO authenticated;
GRANT ALL ON public.friendships TO authenticated;
GRANT ALL ON public.friend_suggestions TO authenticated;

-- 6. Create function permissions for generate_friend_suggestions
-- This ensures the function can bypass RLS when needed
ALTER FUNCTION generate_friend_suggestions(uuid, integer) SECURITY DEFINER;

-- 7. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_friend_suggestions(uuid, integer) TO authenticated;