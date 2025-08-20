-- EMERGENCY: Stop the infinite loop by temporarily disabling triggers
-- Run this immediately to stop the stack overflow

BEGIN;

-- Disable all triggers on the profiles table temporarily
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- Also disable triggers on related tables to be safe
ALTER TABLE public.user_education DISABLE TRIGGER ALL;
ALTER TABLE public.user_experiences DISABLE TRIGGER ALL; 
ALTER TABLE public.user_goals DISABLE TRIGGER ALL;
ALTER TABLE public.user_industries DISABLE TRIGGER ALL;
ALTER TABLE public.user_projects DISABLE TRIGGER ALL;

-- If profile_sections table exists, disable its triggers too
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_sections') THEN
    ALTER TABLE public.profile_sections DISABLE TRIGGER ALL;
  END IF;
END $$;

COMMIT;

-- Now you can safely run operations without triggering the loop
-- After fixing the issue, you can re-enable triggers with:
-- ALTER TABLE public.profiles ENABLE TRIGGER ALL;
-- etc.