-- Post-Onboarding Completion System
-- Tracks user progress on post-onboarding steps and awards achievements

-- Create onboarding steps tracking table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  step_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, step_name)
);

-- Enable RLS on onboarding_progress
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only see their own onboarding progress
CREATE POLICY "Users can view own onboarding progress" ON public.onboarding_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own onboarding progress" ON public.onboarding_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding progress" ON public.onboarding_progress
  FOR UPDATE USING (user_id = auth.uid());

-- Function to calculate and update onboarding progress
CREATE OR REPLACE FUNCTION public.complete_onboarding_step(
  user_uuid UUID,
  step_name TEXT,
  step_metadata JSONB DEFAULT '{}'
) RETURNS JSON AS $$
DECLARE
  total_steps INTEGER := 4; -- explore_engage, complete_profile, join_conversation, share_knowledge
  completed_steps INTEGER;
  completion_percentage INTEGER;
  step_achievements RECORD;
  was_already_completed BOOLEAN;
BEGIN
  -- Check if step was already completed
  SELECT EXISTS (
    SELECT 1 FROM public.onboarding_progress 
    WHERE user_id = user_uuid AND step_name = complete_onboarding_step.step_name
  ) INTO was_already_completed;

  -- Insert or update step completion
  INSERT INTO public.onboarding_progress (user_id, step_name, metadata)
  VALUES (user_uuid, step_name, step_metadata)
  ON CONFLICT (user_id, step_name) DO UPDATE SET
    completed_at = NOW(),
    metadata = step_metadata;

  -- Count completed steps
  SELECT COUNT(*) INTO completed_steps
  FROM public.onboarding_progress
  WHERE user_id = user_uuid;

  -- Calculate percentage
  completion_percentage := (completed_steps * 100) / total_steps;

  -- Update profile completion percentage
  UPDATE public.profiles
  SET profile_completion_percentage = GREATEST(profile_completion_percentage, completion_percentage)
  WHERE id = user_uuid;

  -- Award achievement for this step (if not already completed and achievement exists)
  IF NOT was_already_completed THEN
    FOR step_achievements IN
      SELECT a.* FROM public.achievements a 
      WHERE a.criteria->>'onboarding_step' = step_name 
      AND a.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua 
        WHERE ua.user_id = user_uuid AND ua.achievement_id = a.id
      )
    LOOP
      -- Award achievement
      INSERT INTO public.user_achievements (
        user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
      ) VALUES (
        user_uuid, step_achievements.id, step_achievements.category,
        step_achievements.name, step_achievements.description, step_achievements.icon_name, NOW()
      );

      -- Award voltz
      UPDATE public.profiles
      SET spendable_voltz = spendable_voltz + step_achievements.voltz_reward,
          total_voltz_earned = total_voltz_earned + step_achievements.voltz_reward
      WHERE id = user_uuid;

      -- Log voltz transaction
      INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
      VALUES (
        user_uuid, step_achievements.voltz_reward,
        'Onboarding step: ' || step_name, 'achievement', step_achievements.id::text, 'earned'
      );
    END LOOP;
  END IF;

  -- Check for completion bonus (all steps completed)
  IF completed_steps = total_steps THEN
    -- Award completion bonus achievement if not already awarded
    INSERT INTO public.user_achievements (
      user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
    )
    SELECT user_uuid, a.id, a.category, a.name, a.description, a.icon_name, NOW()
    FROM public.achievements a
    WHERE a.criteria->>'onboarding_step' = 'complete_onboarding'
    AND a.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.user_id = user_uuid AND ua.achievement_id = a.id
    );
  END IF;

  RETURN json_build_object(
    'completed_steps', completed_steps,
    'total_steps', total_steps,
    'completion_percentage', completion_percentage,
    'was_already_completed', was_already_completed,
    'step_completed', step_name
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's onboarding progress
CREATE OR REPLACE FUNCTION public.get_onboarding_progress(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  total_steps INTEGER := 4;
  completed_steps INTEGER;
  completion_percentage INTEGER;
  steps_completed TEXT[];
  result JSON;
BEGIN
  -- Get completed steps
  SELECT 
    COUNT(*),
    array_agg(step_name ORDER BY completed_at)
  INTO completed_steps, steps_completed
  FROM public.onboarding_progress
  WHERE user_id = user_uuid;

  -- Calculate percentage
  completion_percentage := CASE 
    WHEN completed_steps > 0 THEN (completed_steps * 100) / total_steps
    ELSE 0 
  END;

  RETURN json_build_object(
    'completed_steps', completed_steps,
    'total_steps', total_steps,
    'completion_percentage', completion_percentage,
    'steps_completed', COALESCE(steps_completed, ARRAY[]::TEXT[]),
    'is_completed', completed_steps >= total_steps
  );
END;
$$ LANGUAGE plpgsql;

-- Seed onboarding-related achievements
DO $$
BEGIN
  -- Insert achievements only if they don't already exist
  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE name = 'Platform Explorer') THEN
    INSERT INTO public.achievements (name, description, icon_name, category, rarity, criteria, voltz_reward, is_active) VALUES
    ('Platform Explorer', 'Explored and engaged with the main feed', 'compass', 'completion', 'common', '{"onboarding_step": "explore_engage"}', 100, true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE name = 'Profile Master') THEN
    INSERT INTO public.achievements (name, description, icon_name, category, rarity, criteria, voltz_reward, is_active) VALUES
    ('Profile Master', 'Completed your profile information', 'user-check', 'completion', 'common', '{"onboarding_step": "complete_profile"}', 150, true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE name = 'Community Member') THEN
    INSERT INTO public.achievements (name, description, icon_name, category, rarity, criteria, voltz_reward, is_active) VALUES
    ('Community Member', 'Joined the conversation by commenting or liking', 'users', 'social', 'common', '{"onboarding_step": "join_conversation"}', 100, true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE name = 'Knowledge Sharer') THEN
    INSERT INTO public.achievements (name, description, icon_name, category, rarity, criteria, voltz_reward, is_active) VALUES
    ('Knowledge Sharer', 'Shared your first insight with the community', 'share', 'social', 'common', '{"onboarding_step": "share_knowledge"}', 200, true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE name = 'Onboarding Graduate') THEN
    INSERT INTO public.achievements (name, description, icon_name, category, rarity, criteria, voltz_reward, is_active) VALUES
    ('Onboarding Graduate', 'Completed all post-onboarding steps', 'award', 'milestone', 'uncommon', '{"onboarding_step": "complete_onboarding"}', 500, true);
  END IF;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.complete_onboarding_step(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_onboarding_progress(UUID) TO authenticated;
GRANT ALL ON TABLE public.onboarding_progress TO authenticated;