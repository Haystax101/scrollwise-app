-- Profile Redesign Database Schema Enhancements

-- Add new fields to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS profile_completion_percentage integer DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);

-- Create user_achievements table for tracking user milestones
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text,
  icon_name text,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create profile_sections table for customizable profile content
CREATE TABLE IF NOT EXISTS public.profile_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section_type text NOT NULL CHECK (section_type IN ('summary', 'skills', 'interests', 'custom')),
  content text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_sections_pkey PRIMARY KEY (id),
  CONSTRAINT profile_sections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_section UNIQUE (user_id, section_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON public.user_achievements(earned_at);
CREATE INDEX IF NOT EXISTS idx_profile_sections_user_id ON public.profile_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_sections_type ON public.profile_sections(section_type);

-- Insert some sample achievements for testing
INSERT INTO public.user_achievements (user_id, achievement_type, title, description, icon_name)
SELECT 
  p.id,
  'first_insight',
  'First Insight',
  'Published your first insight',
  'lightbulb'
FROM public.profiles p
WHERE p.xp > 0 AND NOT EXISTS (
  SELECT 1 FROM public.user_achievements ua 
  WHERE ua.user_id = p.id AND ua.achievement_type = 'first_insight'
)
LIMIT 5;

INSERT INTO public.user_achievements (user_id, achievement_type, title, description, icon_name)
SELECT 
  p.id,
  'level_up',
  'Level ' || p.level,
  'Reached level ' || p.level,
  'trophy'
FROM public.profiles p
WHERE p.level > 1 AND NOT EXISTS (
  SELECT 1 FROM public.user_achievements ua 
  WHERE ua.user_id = p.id AND ua.achievement_type = 'level_up'
)
LIMIT 10;

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  completion_score integer := 0;
  total_possible integer := 100;
BEGIN
  -- Base profile info (20 points)
  SELECT CASE 
    WHEN full_name IS NOT NULL AND full_name != '' THEN 10 
    ELSE 0 
  END +
  CASE 
    WHEN bio IS NOT NULL AND bio != '' THEN 10 
    ELSE 0 
  END INTO completion_score
  FROM profiles WHERE id = user_uuid;
  
  -- Education (15 points)
  IF EXISTS (SELECT 1 FROM user_education WHERE user_id = user_uuid) THEN
    completion_score := completion_score + 15;
  END IF;
  
  -- Experience (15 points)
  IF EXISTS (SELECT 1 FROM user_experiences WHERE user_id = user_uuid) THEN
    completion_score := completion_score + 15;
  END IF;
  
  -- Goals (10 points)
  IF EXISTS (SELECT 1 FROM user_goals WHERE user_id = user_uuid) THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Industries/Interests (15 points)
  IF EXISTS (SELECT 1 FROM user_industries WHERE user_id = user_uuid) THEN
    completion_score := completion_score + 15;
  END IF;
  
  -- Projects (10 points)
  IF EXISTS (SELECT 1 FROM user_projects WHERE user_id = user_uuid) THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Avatar (5 points)
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_uuid AND avatar_url IS NOT NULL) THEN
    completion_score := completion_score + 5;
  END IF;
  
  -- Profile sections (10 points)
  IF EXISTS (SELECT 1 FROM profile_sections WHERE user_id = user_uuid) THEN
    completion_score := completion_score + 10;
  END IF;
  
  RETURN completion_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles 
  SET profile_completion_percentage = calculate_profile_completion(
    CASE 
      WHEN TG_TABLE_NAME = 'profiles' THEN NEW.id
      ELSE NEW.user_id 
    END
  )
  WHERE id = CASE 
    WHEN TG_TABLE_NAME = 'profiles' THEN NEW.id
    ELSE NEW.user_id 
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update profile completion
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

DROP TRIGGER IF EXISTS trigger_update_profile_completion_sections ON public.profile_sections;
CREATE TRIGGER trigger_update_profile_completion_sections
  AFTER INSERT OR UPDATE OR DELETE ON public.profile_sections
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

-- Award achievements function
CREATE OR REPLACE FUNCTION award_achievement(
  user_uuid uuid, 
  achievement_type_param text, 
  title_param text, 
  description_param text DEFAULT NULL,
  icon_param text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_achievement_id uuid;
BEGIN
  -- Check if user already has this achievement type
  IF NOT EXISTS (
    SELECT 1 FROM user_achievements 
    WHERE user_id = user_uuid AND achievement_type = achievement_type_param
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_type, title, description, icon_name)
    VALUES (user_uuid, achievement_type_param, title_param, description_param, icon_param)
    RETURNING id INTO new_achievement_id;
    
    RETURN new_achievement_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for new tables
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_sections ENABLE ROW LEVEL SECURITY;

-- Achievements policies
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' achievements" ON public.user_achievements
  FOR SELECT USING (true);

-- Profile sections policies  
CREATE POLICY "Users can manage their own profile sections" ON public.profile_sections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' profile sections" ON public.profile_sections
  FOR SELECT USING (true);