-- Re-enable all triggers after migration is complete

BEGIN;

-- Re-enable triggers on all tables
ALTER TABLE public.profiles ENABLE TRIGGER ALL;
ALTER TABLE public.user_education ENABLE TRIGGER ALL;
ALTER TABLE public.user_experiences ENABLE TRIGGER ALL; 
ALTER TABLE public.user_goals ENABLE TRIGGER ALL;
ALTER TABLE public.user_industries ENABLE TRIGGER ALL;
ALTER TABLE public.user_projects ENABLE TRIGGER ALL;

-- If profile_sections table exists, re-enable its triggers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_sections') THEN
    ALTER TABLE public.profile_sections ENABLE TRIGGER ALL;
  END IF;
END $$;

COMMIT;