-- Fix Profile Completion Tracking System
-- This creates a comprehensive system to track when users complete their profile
-- Profile is 100% complete when user has:
-- 1. Career Goal (user_goals table has entry)
-- 2. Work Experience (user_experiences table has entry)  
-- 3. Education (user_education table has entry)
-- 4. Skills (user_skills table has entry)

-- Drop existing profile completion triggers to avoid conflicts
DROP TRIGGER IF EXISTS profile_completion_trigger_goals ON public.user_goals;
DROP TRIGGER IF EXISTS profile_completion_trigger_experiences ON public.user_experiences;
DROP TRIGGER IF EXISTS profile_completion_trigger_education ON public.user_education;
DROP TRIGGER IF EXISTS profile_completion_trigger_skills ON public.user_skills;

-- 1. Create profile completion checking function
CREATE OR REPLACE FUNCTION public.check_and_update_profile_completion(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  has_goals BOOLEAN := FALSE;
  has_experiences BOOLEAN := FALSE;
  has_education BOOLEAN := FALSE;
  has_skills BOOLEAN := FALSE;
  is_complete BOOLEAN := FALSE;
  current_completion INTEGER;
BEGIN
  -- Check if user has career goals
  SELECT EXISTS (
    SELECT 1 FROM public.user_goals 
    WHERE user_id = target_user_id 
    AND goal IS NOT NULL 
    AND goal != ''
  ) INTO has_goals;
  
  -- Check if user has work experiences
  SELECT EXISTS (
    SELECT 1 FROM public.user_experiences 
    WHERE user_id = target_user_id 
    AND position_title IS NOT NULL 
    AND position_title != ''
  ) INTO has_experiences;
  
  -- Check if user has education
  SELECT EXISTS (
    SELECT 1 FROM public.user_education 
    WHERE user_id = target_user_id 
    AND (
      (degree_name IS NOT NULL AND degree_name != '') OR
      (university_name IS NOT NULL AND university_name != '') OR
      (field_of_study IS NOT NULL AND field_of_study != '')
    )
  ) INTO has_education;
  
  -- Check if user has skills
  SELECT EXISTS (
    SELECT 1 FROM public.user_skills 
    WHERE user_id = target_user_id 
    AND skill_name IS NOT NULL 
    AND skill_name != ''
  ) INTO has_skills;
  
  -- Determine if profile is complete (all 4 sections filled)
  is_complete := has_goals AND has_experiences AND has_education AND has_skills;
  
  -- Get current completion percentage
  SELECT profile_completion_percentage INTO current_completion
  FROM public.profiles
  WHERE id = target_user_id;
  
  -- Update profile completion percentage
  IF is_complete AND (current_completion IS NULL OR current_completion < 100) THEN
    -- Profile is now 100% complete
    UPDATE public.profiles
    SET profile_completion_percentage = 100
    WHERE id = target_user_id;
    
    -- Trigger the onboarding achievement check for profile completion
    PERFORM public.check_onboarding_achievements(target_user_id, 'profile_completion');
    
    RAISE NOTICE 'Profile completion updated to 100%% for user %', target_user_id;
    
  ELSIF NOT is_complete AND current_completion = 100 THEN
    -- Profile is no longer complete (user removed something), reduce to 75%
    UPDATE public.profiles
    SET profile_completion_percentage = 75
    WHERE id = target_user_id;
    
    RAISE NOTICE 'Profile completion reduced from 100%% for user % (missing sections)', target_user_id;
    
  ELSIF NOT is_complete THEN
    -- Calculate partial completion (25% per section)
    DECLARE
      completion_score INTEGER := 0;
    BEGIN
      IF has_goals THEN completion_score := completion_score + 25; END IF;
      IF has_experiences THEN completion_score := completion_score + 25; END IF;
      IF has_education THEN completion_score := completion_score + 25; END IF;
      IF has_skills THEN completion_score := completion_score + 25; END IF;
      
      -- Only update if the score is higher than current (don't reduce partial progress)
      IF completion_score > COALESCE(current_completion, 0) THEN
        UPDATE public.profiles
        SET profile_completion_percentage = completion_score
        WHERE id = target_user_id;
        
        RAISE NOTICE 'Profile completion updated to %% for user %', completion_score, target_user_id;
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger function for profile completion updates
CREATE OR REPLACE FUNCTION public.trigger_profile_completion_check()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user_id from the appropriate record
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;
  
  -- Check and update profile completion
  PERFORM public.check_and_update_profile_completion(target_user_id);
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Create triggers on all profile-related tables

-- Career Goals trigger
CREATE TRIGGER profile_completion_trigger_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION public.trigger_profile_completion_check();

-- Work Experience trigger  
CREATE TRIGGER profile_completion_trigger_experiences
  AFTER INSERT OR UPDATE OR DELETE ON public.user_experiences
  FOR EACH ROW EXECUTE FUNCTION public.trigger_profile_completion_check();

-- Education trigger
CREATE TRIGGER profile_completion_trigger_education
  AFTER INSERT OR UPDATE OR DELETE ON public.user_education
  FOR EACH ROW EXECUTE FUNCTION public.trigger_profile_completion_check();

-- Skills trigger
CREATE TRIGGER profile_completion_trigger_skills
  AFTER INSERT OR UPDATE OR DELETE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION public.trigger_profile_completion_check();

-- 4. Create a function to manually recalculate all users' profile completion (for migration)
CREATE OR REPLACE FUNCTION public.recalculate_all_profile_completion()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Loop through all users and recalculate their profile completion
  FOR user_record IN
    SELECT id FROM public.profiles
  LOOP
    PERFORM public.check_and_update_profile_completion(user_record.id);
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.check_and_update_profile_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_profile_completion_check() TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_all_profile_completion() TO authenticated;

-- 6. Optionally run recalculation for existing users (uncomment if needed)
-- SELECT public.recalculate_all_profile_completion();

-- 7. Test notification
DO $$
BEGIN
  RAISE NOTICE 'Profile completion tracking system installed successfully!';
  RAISE NOTICE 'Profile is 100%% complete when user has ALL of:';
  RAISE NOTICE '1. Career Goal (non-empty goal in user_goals)';
  RAISE NOTICE '2. Work Experience (non-empty position_title in user_experiences)';  
  RAISE NOTICE '3. Education (non-empty degree_name, university_name, or field_of_study in user_education)';
  RAISE NOTICE '4. Skills (non-empty skill_name in user_skills)';
  RAISE NOTICE '';
  RAISE NOTICE 'System features:';
  RAISE NOTICE '- Automatic triggers on INSERT/UPDATE/DELETE for all profile tables';
  RAISE NOTICE '- Sets profile_completion_percentage to 100 when all sections complete';
  RAISE NOTICE '- Automatically triggers onboarding "Profile Perfectionist" achievement';
  RAISE NOTICE '- Calculates partial completion (25%% per section) for incomplete profiles';
  RAISE NOTICE '- Includes recalculation function for existing users';
  RAISE NOTICE '';
  RAISE NOTICE 'To recalculate all existing users, run: SELECT public.recalculate_all_profile_completion();';
END $$;