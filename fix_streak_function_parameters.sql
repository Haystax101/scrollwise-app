-- Fix for setup_user_learning_streak function parameter names
-- The onboarding component calls it with user_id_param and target_days_param
-- but the function was defined with p_user_id and p_target_days

BEGIN;

-- Drop the existing function
DROP FUNCTION IF EXISTS setup_user_learning_streak(UUID, INTEGER, TEXT);

-- Recreate with parameter names that match the RPC call
CREATE OR REPLACE FUNCTION setup_user_learning_streak(
  user_id_param UUID,
  target_days_param INTEGER DEFAULT 7,
  streak_type_param TEXT DEFAULT 'daily_learning'
) RETURNS UUID AS $$
DECLARE
  streak_id UUID;
BEGIN
  INSERT INTO user_streaks (user_id, streak_type, target_days)
  VALUES (user_id_param, streak_type_param, target_days_param)
  ON CONFLICT (user_id, streak_type) DO UPDATE
  SET 
    target_days = EXCLUDED.target_days,
    updated_at = NOW()
  RETURNING id INTO streak_id;
  
  RETURN streak_id;
END;
$$ LANGUAGE plpgsql;

-- Also fix the complete_user_onboarding function call to match
CREATE OR REPLACE FUNCTION complete_user_onboarding(
  p_user_id UUID,
  p_industries TEXT[],
  p_dream_role TEXT,
  p_dream_company TEXT,
  p_current_role TEXT DEFAULT NULL,
  p_current_company TEXT DEFAULT NULL,
  p_weekly_streak_goal INTEGER DEFAULT 7
) RETURNS BOOLEAN AS $$
DECLARE
  company_id UUID;
  goal_company_id UUID;
BEGIN
  -- Set up learning streak with corrected parameter names
  PERFORM setup_user_learning_streak(p_user_id, p_weekly_streak_goal);
  
  -- Handle dream company
  IF p_dream_company IS NOT NULL AND p_dream_company != '' THEN
    -- Find or create dream company
    INSERT INTO companies (name) VALUES (p_dream_company)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO goal_company_id;
    
    -- Create career goal
    INSERT INTO user_goals (user_id, goal, goal_type, status, priority)
    VALUES (p_user_id, p_dream_role, 'career', 'active', 1);
    
    -- Link to goal company
    INSERT INTO user_goal_companies (user_id, company_id)
    VALUES (p_user_id, goal_company_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Handle current work if provided
  IF p_current_role IS NOT NULL AND p_current_company IS NOT NULL THEN
    -- Find or create current company
    INSERT INTO companies (name) VALUES (p_current_company)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO company_id;
    
    -- Create work experience
    INSERT INTO user_experiences (
      user_id, company_id, position_title, is_current, employment_type, start_date
    ) VALUES (
      p_user_id, company_id, p_current_role, true, 'full_time', CURRENT_DATE
    );
  END IF;
  
  -- Initialize learning analytics
  INSERT INTO user_learning_analytics (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Check for initial achievements
  PERFORM check_and_award_achievements(p_user_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION setup_user_learning_streak(UUID, INTEGER, TEXT) TO authenticated;

COMMIT;