-- Cleanup Redundant RLS Policies
-- This script removes duplicate and conflicting policies from the previous RLS setup

-- 1. Clean up profiles table - remove redundant policies
-- We have multiple SELECT policies that overlap, keep only the most permissive one

-- Drop redundant profiles policies
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow basic profile info for insights" ON public.profiles;
DROP POLICY IF EXISTS "Allow viewing public profiles" ON public.profiles;

-- Keep only: "Allow reading profile info for authenticated users" and the management policies

-- 2. Clean up user_goal_companies table - remove duplicate management policies
-- We have 4 different ALL policies that do the same thing

DROP POLICY IF EXISTS "Allow full access to own data" ON public.user_goal_companies;
DROP POLICY IF EXISTS "Users can manage own goal companies" ON public.user_goal_companies;
DROP POLICY IF EXISTS "Users can manage their own goal companies" ON public.user_goal_companies;

-- This leaves us with just "Allow reading goal companies for authenticated users" for SELECT
-- We need to add back a single management policy

CREATE POLICY "Users can manage their own goal companies" ON public.user_goal_companies
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Clean up user_goals table - remove duplicate management policies
-- We have 2 different ALL policies that do the same thing

DROP POLICY IF EXISTS "user_goals_policy" ON public.user_goals;

-- Keep "Users can manage their own goals" and "Allow reading goals for authenticated users"

-- 4. Clean up user_industries table - remove duplicate management policies
-- We have 2 different ALL policies that do the same thing

DROP POLICY IF EXISTS "user_industries_policy" ON public.user_industries;

-- Keep "Users can manage their own industries" and "Allow reading industries for authenticated users"

-- 5. Verify the final clean state
-- Show the cleaned up policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE
        WHEN length(qual) > 80 THEN left(qual, 77) || '...'
        ELSE qual
    END as policy_condition_summary
FROM pg_policies
WHERE tablename IN ('profiles', 'user_industries', 'user_goals', 'user_goal_companies', 'profile_passions')
ORDER BY tablename, cmd, policyname;