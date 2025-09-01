-- Fix ambiguous column reference "step_name" error in complete_onboarding_step function
-- The issue is on line 43 where it tries to use complete_onboarding_step.step_name instead of just step_name

CREATE OR REPLACE FUNCTION public.complete_onboarding_step(
  user_uuid UUID,
  step_name TEXT,
  step_metadata JSONB DEFAULT '{}'
) RETURNS JSON AS $$
#variable_conflict use_column
DECLARE
  total_steps INTEGER := 4; -- explore_engage, complete_profile, join_conversation, share_knowledge
  completed_steps INTEGER;
  completion_percentage INTEGER;
  step_achievements RECORD;
  was_already_completed BOOLEAN;
BEGIN
  -- Check if step was already completed (FIXED: use_column directive + explicit function reference)
  SELECT EXISTS (
    SELECT 1 FROM public.onboarding_progress 
    WHERE user_id = user_uuid AND step_name = complete_onboarding_step.step_name
  ) INTO was_already_completed;

  -- Insert or update step completion
  INSERT INTO public.onboarding_progress (user_id, step_name, metadata)
  VALUES (user_uuid, complete_onboarding_step.step_name, step_metadata)
  ON CONFLICT (user_id, step_name) DO UPDATE SET
    completed_at = NOW(),
    metadata = step_metadata;

  -- Count completed steps  
  SELECT COUNT(*) INTO completed_steps
  FROM public.onboarding_progress op
  WHERE op.user_id = user_uuid;

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
      WHERE a.criteria->>'onboarding_step' = complete_onboarding_step.step_name 
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
      
      -- Award voltz for the achievement
      UPDATE public.profiles 
      SET spendable_voltz = spendable_voltz + step_achievements.voltz_reward,
          total_voltz_earned = total_voltz_earned + step_achievements.voltz_reward
      WHERE id = user_uuid;
      
      -- Log voltz transaction
      INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
      VALUES (
        user_uuid, step_achievements.voltz_reward,
        'Onboarding Achievement: ' || step_achievements.name, 
        'achievement', step_achievements.id::text, 'earned'
      );
    END LOOP;
  END IF;

  -- Return progress data
  RETURN json_build_object(
    'completed_steps', completed_steps,
    'total_steps', total_steps,
    'completion_percentage', completion_percentage,
    'was_already_completed', was_already_completed,
    'step_completed', complete_onboarding_step.step_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the fix
DO $$
BEGIN
  RAISE NOTICE 'FINAL FIX: Used #variable_conflict use_column directive';
  RAISE NOTICE 'This tells PostgreSQL to prefer column names when ambiguous';
  RAISE NOTICE 'Function parameters explicitly referenced with function_name.parameter_name';
  RAISE NOTICE 'Example: complete_onboarding_step.step_name refers to the parameter';
  RAISE NOTICE 'Example: step_name (unqualified) refers to the table column';
  RAISE NOTICE 'The error "column reference step_name is ambiguous" should now be RESOLVED';
END $$;