-- Fix the profile completion trigger function
-- This addresses the "record NEW has no field user_id" error

BEGIN;

-- Drop the problematic trigger function and recreate it correctly
DROP FUNCTION IF EXISTS update_profile_completion() CASCADE;

-- Recreate the function with proper field handling
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS trigger AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Determine the correct user_id based on which table triggered this
  IF TG_TABLE_NAME = 'profiles' THEN
    target_user_id := NEW.id;  -- profiles table uses 'id' not 'user_id'
  ELSE
    target_user_id := NEW.user_id;  -- other tables use 'user_id'
  END IF;
  
  -- Handle DELETE operations (OLD record instead of NEW)
  IF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'profiles' THEN
      target_user_id := OLD.id;
    ELSE
      target_user_id := OLD.user_id;
    END IF;
  END IF;
  
  -- Update the profile completion percentage
  UPDATE profiles 
  SET profile_completion_percentage = calculate_profile_completion(target_user_id)
  WHERE id = target_user_id;
  
  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate all the triggers
DROP TRIGGER IF EXISTS trigger_update_profile_completion_profiles ON public.profiles;
CREATE TRIGGER trigger_update_profile_completion_profiles
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS trigger_update_profile_completion_education ON public.user_education;
CREATE TRIGGER trigger_update_profile_completion_education
  AFTER INSERT OR UPDATE OR DELETE ON public.user_education
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS trigger_update_profile_completion_experience ON public.user_experiences;
CREATE TRIGGER trigger_update_profile_completion_experience
  AFTER INSERT OR UPDATE OR DELETE ON public.user_experiences
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS trigger_update_profile_completion_goals ON public.user_goals;
CREATE TRIGGER trigger_update_profile_completion_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS trigger_update_profile_completion_industries ON public.user_industries;
CREATE TRIGGER trigger_update_profile_completion_industries
  AFTER INSERT OR UPDATE OR DELETE ON public.user_industries
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS trigger_update_profile_completion_projects ON public.user_projects;
CREATE TRIGGER trigger_update_profile_completion_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.user_projects
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

-- Only create this trigger if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_sections') THEN
    DROP TRIGGER IF EXISTS trigger_update_profile_completion_sections ON public.profile_sections;
    CREATE TRIGGER trigger_update_profile_completion_sections
      AFTER INSERT OR UPDATE OR DELETE ON public.profile_sections
      FOR EACH ROW EXECUTE FUNCTION update_profile_completion();
  END IF;
END $$;

COMMIT;