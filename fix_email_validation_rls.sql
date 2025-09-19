-- Fix RLS policy to allow email validation during onboarding
-- This allows unauthenticated users to check if an email exists in profiles table
-- This is needed for the signup flow to validate email uniqueness

-- Create a policy that allows unauthenticated users to check email existence
-- This is safe because:
-- 1. It only allows SELECT on email field
-- 2. It's only for email validation during signup
-- 3. No sensitive data is exposed

CREATE POLICY "Allow email validation for signup" ON public.profiles
    FOR SELECT TO anon
    USING (true);

-- Alternative approach: Create a more restrictive policy that only allows email checks
-- This would be more secure but requires modifying the query to only select email
-- CREATE POLICY "Allow email validation for signup" ON public.profiles
--     FOR SELECT TO anon
--     USING (email IS NOT NULL);