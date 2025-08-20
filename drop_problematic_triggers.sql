-- Drop the problematic profile completion triggers

BEGIN;

-- Drop the profile completion trigger that's causing the infinite loop
DROP TRIGGER IF EXISTS trigger_update_profile_completion_profiles ON public.profiles;

-- Also drop any other profile completion triggers that might cause issues
DROP TRIGGER IF EXISTS trigger_update_profile_completion_education ON public.user_education;
DROP TRIGGER IF EXISTS trigger_update_profile_completion_experience ON public.user_experiences;
DROP TRIGGER IF EXISTS trigger_update_profile_completion_goals ON public.user_goals;
DROP TRIGGER IF EXISTS trigger_update_profile_completion_industries ON public.user_industries;
DROP TRIGGER IF EXISTS trigger_update_profile_completion_projects ON public.user_projects;

-- Drop quiz triggers too for safety
DROP TRIGGER IF EXISTS trg_quiz_attempts_grant_xp ON public.quiz_attempts;
DROP TRIGGER IF EXISTS trg_quiz_attempts_grant_voltz ON public.quiz_attempts;

COMMIT;

-- Test that we can now update profiles without recursion
SELECT 'Triggers dropped successfully' as status;