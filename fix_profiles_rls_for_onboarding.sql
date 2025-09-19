-- Fix RLS policies for profiles table to allow onboarding updates
-- This script ensures users can update their own profile during and after onboarding

-- First, enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow basic profile info for insights" ON public.profiles;

-- Create comprehensive RLS policies for profiles table

-- 1. Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 2. Allow users to insert their own profile (for onboarding)
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile (for onboarding and later updates)
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Allow viewing basic profile info for insight authors (existing functionality)
CREATE POLICY "Allow basic profile info for insights" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        -- Allow reading profiles of users who have authored insights
        id IN (
            SELECT DISTINCT author_id
            FROM public.insights
            WHERE author_id IS NOT NULL
        )
    );

-- 5. Allow viewing public profiles for friends and discovery features
CREATE POLICY "Allow viewing public profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        -- Allow viewing profiles that are public
        public_profile = true OR
        -- Or profiles of users we are friends with
        id IN (
            SELECT CASE
                WHEN requester_id = auth.uid() THEN addressee_id
                WHEN addressee_id = auth.uid() THEN requester_id
            END
            FROM public.friendships
            WHERE status = 'accepted' AND (requester_id = auth.uid() OR addressee_id = auth.uid())
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Ensure the profiles table references auth.users correctly
-- (This should already exist, but confirming)
-- Note: The foreign key constraint should already be:
-- CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)