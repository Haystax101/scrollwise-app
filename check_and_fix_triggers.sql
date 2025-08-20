-- Check current trigger situation and fix the loop

BEGIN;

-- First, let's see what triggers exist on profiles table
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- Drop the specific problematic trigger (not all triggers)
DROP TRIGGER IF EXISTS trigger_update_profile_completion_profiles ON public.profiles;

-- Also check if there are any other profile-related triggers causing issues
DROP TRIGGER IF EXISTS trg_quiz_attempts_grant_xp ON public.quiz_attempts;
DROP TRIGGER IF EXISTS trg_quiz_attempts_grant_voltz ON public.quiz_attempts;

COMMIT;

-- Now try to do a simple test update to see if the loop is broken
-- UPDATE public.profiles SET full_name = full_name WHERE id = (SELECT id FROM profiles LIMIT 1);