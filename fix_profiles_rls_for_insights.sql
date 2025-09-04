-- Fix RLS policies for profiles table to allow reading author information for insights
-- The issue is that users can't read other users' profile data needed for insight authors

-- Check current policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- The profiles table likely has restrictive RLS that only allows users to see their own profile
-- We need to add a policy that allows reading basic profile info (full_name, avatar_url) 
-- for insight authors

-- Add policy to allow reading basic profile info for all authenticated users


-- Alternative simpler policy if the above is too complex:
-- This allows all authenticated users to read basic profile fields for any user
-- (Comment out the above policy and uncomment this if needed)

CREATE POLICY "Allow reading basic profile info" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- Show updated policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';