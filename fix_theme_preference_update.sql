-- Fix Theme Preference Update Issue
-- This file addresses the RLS policy issue preventing users from updating their theme preference

-- ==========================================
-- 1. Add Profile Update Policy for RLS
-- ==========================================

-- Check if RLS is enabled on profiles table
-- If it's enabled but there's no UPDATE policy, users can't update their profiles

-- Add policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Also ensure users can read their own profile (in case this is missing)
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- ==========================================
-- 2. Update Theme Preference Constraint
-- ==========================================

-- Update the constraint to only allow 'light' and 'dark' (remove 'system')
-- First drop the existing constraint (try both possible names)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS theme_preference_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;

-- Add the new constraint
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_theme_preference_check
CHECK (theme_preference IN ('light', 'dark'));

-- ==========================================
-- 3. Clean Up Existing Data
-- ==========================================

-- Update any remaining 'system' values to 'dark'
UPDATE public.profiles
SET theme_preference = 'dark'
WHERE theme_preference = 'system' OR theme_preference IS NULL;

-- ==========================================
-- 4. Verification Queries (Optional)
-- ==========================================

-- Check that RLS policies are working
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'profiles' AND cmd = 'UPDATE';

-- Check theme preference constraint
-- SELECT conname, consrc
-- FROM pg_constraint
-- WHERE conrelid = 'public.profiles'::regclass
-- AND conname LIKE '%theme%';

-- Check for any remaining invalid theme preferences
-- SELECT id, theme_preference, COUNT(*)
-- FROM public.profiles
-- WHERE theme_preference NOT IN ('light', 'dark')
-- GROUP BY id, theme_preference;