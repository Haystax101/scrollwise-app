-- Fix RLS Policies for Profile Data Access
-- This file updates Row Level Security policies to allow authenticated users to view other users' profile data
-- This enables the UserDetailModal to display complete profile information for all users

-- 1. Update profiles table policies
-- First check if the general reading policy already exists
DO $$
BEGIN
    -- Drop the existing policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Allow reading basic profile info'
    ) THEN
        DROP POLICY "Allow reading basic profile info" ON public.profiles;
    END IF;
END
$$;

-- Create a comprehensive policy for reading profile data
CREATE POLICY "Allow reading profile info for authenticated users" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Update user_industries table policies
-- Allow authenticated users to view industry interests of other users
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE public.user_industries ENABLE ROW LEVEL SECURITY;

    -- Drop existing restrictive policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_industries'
        AND policyname = 'Users can view their own industries'
    ) THEN
        DROP POLICY "Users can view their own industries" ON public.user_industries;
    END IF;

    -- Create new policy to allow viewing any user's industries
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_industries'
        AND policyname = 'Allow reading industries for authenticated users'
    ) THEN
        CREATE POLICY "Allow reading industries for authenticated users" ON public.user_industries
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- 3. Update user_goals table policies
-- Allow authenticated users to view career goals of other users
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

    -- Drop existing restrictive policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_goals'
        AND policyname = 'Users can view their own goals'
    ) THEN
        DROP POLICY "Users can view their own goals" ON public.user_goals;
    END IF;

    -- Create new policy to allow viewing any user's goals
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_goals'
        AND policyname = 'Allow reading goals for authenticated users'
    ) THEN
        CREATE POLICY "Allow reading goals for authenticated users" ON public.user_goals
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- 4. Update user_goal_companies table policies
-- Allow authenticated users to view career goal companies of other users
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE public.user_goal_companies ENABLE ROW LEVEL SECURITY;

    -- Drop existing restrictive policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_goal_companies'
        AND policyname = 'Users can view their own goal companies'
    ) THEN
        DROP POLICY "Users can view their own goal companies" ON public.user_goal_companies;
    END IF;

    -- Create new policy to allow viewing any user's goal companies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_goal_companies'
        AND policyname = 'Allow reading goal companies for authenticated users'
    ) THEN
        CREATE POLICY "Allow reading goal companies for authenticated users" ON public.user_goal_companies
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- 5. Update profile_passions table policies
-- Allow authenticated users to view what other users are passionate about and working on
DO $$
BEGIN
    -- Drop existing restrictive policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profile_passions'
        AND policyname = 'Users can view their own profile passions'
    ) THEN
        DROP POLICY "Users can view their own profile passions" ON public.profile_passions;
    END IF;

    -- Create new policy to allow viewing any user's passions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profile_passions'
        AND policyname = 'Allow reading passions for authenticated users'
    ) THEN
        CREATE POLICY "Allow reading passions for authenticated users" ON public.profile_passions
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- 6. Ensure users can still manage their own data
-- Keep the existing INSERT/UPDATE/DELETE policies for each table to allow users to manage their own data

-- For user_industries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_industries'
        AND policyname = 'Users can manage their own industries'
    ) THEN
        CREATE POLICY "Users can manage their own industries" ON public.user_industries
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- For user_goals
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_goals'
        AND policyname = 'Users can manage their own goals'
    ) THEN
        CREATE POLICY "Users can manage their own goals" ON public.user_goals
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- For user_goal_companies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_goal_companies'
        AND policyname = 'Users can manage their own goal companies'
    ) THEN
        CREATE POLICY "Users can manage their own goal companies" ON public.user_goal_companies
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- 7. Grant necessary permissions to authenticated role
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_industries TO authenticated;
GRANT SELECT ON public.user_goals TO authenticated;
GRANT SELECT ON public.user_goal_companies TO authenticated;
GRANT SELECT ON public.profile_passions TO authenticated;

-- Also grant access to reference tables that might be needed
GRANT SELECT ON public.industries TO authenticated;
GRANT SELECT ON public.companies TO authenticated;

-- Show the updated policies for verification
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual as policy_condition
FROM pg_policies
WHERE tablename IN ('profiles', 'user_industries', 'user_goals', 'user_goal_companies', 'profile_passions')
ORDER BY tablename, policyname;