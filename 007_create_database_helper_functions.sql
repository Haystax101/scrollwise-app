-- Migration 007: Create Database Helper Functions
-- This migration creates convenient functions for the frontend to interact with the enhanced database schema
-- Provides APIs for streak management, analytics, profile data, and more

BEGIN;

-- Function to get comprehensive user stats for profile display (replaces get_user_stats RPC)
CREATE OR REPLACE FUNCTION get_enhanced_user_stats(user_id_param UUID)
RETURNS TABLE (
  minutes_learned INTEGER,
  posts_liked INTEGER,
  posts_saved INTEGER,
  videos_watched INTEGER,
  current_streak INTEGER,
  longest_streak INTEGER,
  content_pieces_engaged INTEGER,
  achievements_earned INTEGER,
  skills_count INTEGER,
  monthly_progress_percentage DECIMAL,
  weekly_goal_status TEXT
) AS $$
DECLARE
  analytics_data RECORD;
  streak_data RECORD;
  engagement_data RECORD;
BEGIN
  -- Get learning analytics
  SELECT 
    ula.total_learning_time_minutes,
    ula.monthly_minutes_current,
    ula.monthly_minutes_target,
    ula.total_unique_content_pieces
  FROM user_learning_analytics ula
  WHERE ula.user_id = user_id_param 
  INTO analytics_data;
  
  -- Get streak data
  SELECT 
    us.current_streak as curr_streak,
    us.longest_streak as long_streak,
    us.target_days
  FROM user_streaks us
  WHERE us.user_id = user_id_param AND us.is_active = true 
  LIMIT 1 INTO streak_data;
  
  -- Get engagement data
  SELECT 
    COUNT(*) FILTER (WHERE 'liked' = ANY(uci.interaction_types)) as likes_count,
    COUNT(*) FILTER (WHERE 'saved' = ANY(uci.interaction_types)) as saves_count,
    COUNT(DISTINCT (uci.content_type, uci.content_id)) as unique_content
  FROM user_content_interactions uci
  WHERE uci.user_id = user_id_param
  INTO engagement_data;
  
  -- Return comprehensive stats
  RETURN QUERY SELECT
    COALESCE(analytics_data.total_learning_time_minutes, 0),
    COALESCE(engagement_data.likes_count, 0)::INTEGER,
    COALESCE(engagement_data.saves_count, 0)::INTEGER,
    COALESCE(analytics_data.total_unique_content_pieces, 0),
    COALESCE(streak_data.curr_streak, 0),
    COALESCE(streak_data.long_streak, 0),
    COALESCE(engagement_data.unique_content, 0)::INTEGER,
    (SELECT COUNT(*)::INTEGER FROM user_achievements WHERE user_id = user_id_param),
    (SELECT COUNT(*)::INTEGER FROM user_skills WHERE user_id = user_id_param),
    CASE 
      WHEN COALESCE(analytics_data.monthly_minutes_target, 1) > 0 
      THEN (COALESCE(analytics_data.monthly_minutes_current, 0)::DECIMAL / analytics_data.monthly_minutes_target * 100)
      ELSE 0::DECIMAL
    END,
    CASE 
      WHEN streak_data.curr_streak >= streak_data.target_days THEN 'achieved'
      WHEN streak_data.curr_streak > 0 THEN 'in_progress'
      ELSE 'not_started'
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's career goals (separate from streaks)
CREATE OR REPLACE FUNCTION get_user_career_goals(user_id_param UUID)
RETURNS TABLE (
  goal TEXT,
  description TEXT,
  timeframe TEXT,
  target_date DATE,
  progress_percentage DECIMAL,
  status TEXT,
  priority INTEGER,
  companies TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ug.goal,
    ug.description,
    ug.timeframe,
    ug.target_date,
    ug.progress_percentage,
    ug.status,
    ug.priority,
    ARRAY_AGG(c.name) FILTER (WHERE c.name IS NOT NULL) as company_names
  FROM user_goals ug
  LEFT JOIN user_goal_companies ugc ON ug.user_id = ugc.user_id
  LEFT JOIN companies c ON ugc.company_id = c.id
  WHERE ug.user_id = user_id_param 
    AND ug.goal_type = 'career'
    AND ug.status IN ('active', 'in_progress')
  GROUP BY ug.goal, ug.description, ug.timeframe, ug.target_date, ug.progress_percentage, ug.status, ug.priority, ug.created_at
  ORDER BY ug.priority, ug.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current streaks
CREATE OR REPLACE FUNCTION get_user_streaks(user_id_param UUID)
RETURNS TABLE (
  streak_type TEXT,
  target_days INTEGER,
  current_streak INTEGER,
  longest_streak INTEGER,
  last_activity_date DATE,
  progress_message TEXT,
  days_until_goal INTEGER,
  is_goal_achieved BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.streak_type,
    us.target_days,
    us.current_streak,
    us.longest_streak,
    us.last_activity_date,
    CASE 
      WHEN us.current_streak >= us.target_days THEN 'Goal Achieved! 🎉'
      WHEN us.current_streak = 0 THEN 'Start Your Streak Today!'
      ELSE (us.target_days - us.current_streak) || ' more days to goal'
    END as progress_message,
    GREATEST(0, us.target_days - us.current_streak) as days_until_goal,
    us.current_streak >= us.target_days as is_goal_achieved
  FROM user_streaks us
  WHERE us.user_id = user_id_param AND us.is_active = true
  ORDER BY us.streak_type;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's professional profile summary
CREATE OR REPLACE FUNCTION get_user_profile_summary(user_id_param UUID)
RETURNS TABLE (
  full_name TEXT,
  current_position TEXT,
  current_company TEXT,
  location TEXT,
  years_experience INTEGER,
  education_summary TEXT,
  top_skills TEXT[],
  featured_achievements TEXT[],
  active_projects INTEGER,
  profile_completion INTEGER
) AS $$
DECLARE
  profile_data RECORD;
  current_work RECORD;
  education_data RECORD;
  experience_years INTEGER;
BEGIN
  -- Get basic profile
  SELECT full_name FROM profiles WHERE id = user_id_param INTO profile_data;
  
  -- Get current work
  SELECT 
    ue.position_title,
    c.name as company_name,
    ue.location
  FROM user_experiences ue
  LEFT JOIN companies c ON ue.company_id = c.id
  WHERE ue.user_id = user_id_param AND ue.is_current = true
  LIMIT 1 INTO current_work;
  
  -- Calculate years of experience
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN end_date IS NULL AND is_current = true 
        THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))
        WHEN end_date IS NOT NULL AND start_date IS NOT NULL
        THEN EXTRACT(YEAR FROM AGE(end_date, start_date))
        ELSE 0
      END
    )::INTEGER, 0
  ) FROM user_experiences 
  WHERE user_id = user_id_param 
  INTO experience_years;
  
  -- Get education summary
  SELECT 
    COALESCE(degree_name, '') || 
    CASE WHEN u.name IS NOT NULL THEN ' from ' || u.name ELSE '' END
  FROM user_education ue
  LEFT JOIN universities u ON ue.university_id = u.id
  WHERE ue.user_id = user_id_param
  ORDER BY end_date DESC NULLS LAST
  LIMIT 1 INTO education_data;
  
  RETURN QUERY
  SELECT 
    COALESCE(profile_data.full_name, ''),
    COALESCE(current_work.position_title, ''),
    COALESCE(current_work.company_name, ''),
    COALESCE(current_work.location, ''),
    experience_years,
    COALESCE(education_data.degree_name, ''),
    (SELECT ARRAY_AGG(skill_name ORDER BY endorsement_count DESC, proficiency_level DESC) 
     FROM user_skills WHERE user_id = user_id_param AND is_featured = true LIMIT 5),
    (SELECT ARRAY_AGG(title ORDER BY earned_at DESC) 
     FROM user_achievements WHERE user_id = user_id_param AND is_featured = true LIMIT 3),
    (SELECT COUNT(*)::INTEGER FROM user_projects WHERE user_id = user_id_param AND status = 'in_progress'),
    -- Simple profile completion calculation
    (SELECT (
      CASE WHEN profile_data.full_name IS NOT NULL AND profile_data.full_name != '' THEN 20 ELSE 0 END +
      CASE WHEN current_work.position_title IS NOT NULL THEN 20 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM user_skills WHERE user_id = user_id_param) > 0 THEN 20 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM user_experiences WHERE user_id = user_id_param) > 0 THEN 20 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM user_education WHERE user_id = user_id_param) > 0 THEN 20 ELSE 0 END
    )::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Function to record comprehensive user activity (for streak and analytics)
CREATE OR REPLACE FUNCTION record_user_activity(
  p_user_id UUID,
  p_content_type TEXT,
  p_content_id BIGINT,
  p_activity_type TEXT, -- 'view', 'like', 'save', 'comment', 'complete'
  p_duration_seconds INTEGER DEFAULT NULL,
  p_engagement_score DECIMAL DEFAULT 5.0
) RETURNS BOOLEAN AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Record the activity in content interactions
  INSERT INTO user_content_interactions (
    user_id, content_type, content_id, interaction_types, last_interaction_at, total_time_spent_seconds
  ) VALUES (
    p_user_id, p_content_type, p_content_id, ARRAY[p_activity_type], NOW(), COALESCE(p_duration_seconds, 0)
  ) ON CONFLICT (user_id, content_type, content_id) DO UPDATE SET
    interaction_types = CASE 
      WHEN p_activity_type = ANY(user_content_interactions.interaction_types) 
      THEN user_content_interactions.interaction_types
      ELSE array_append(user_content_interactions.interaction_types, p_activity_type)
    END,
    last_interaction_at = NOW(),
    interaction_count = user_content_interactions.interaction_count + 1,
    total_time_spent_seconds = user_content_interactions.total_time_spent_seconds + COALESCE(p_duration_seconds, 0),
    engagement_score = GREATEST(user_content_interactions.engagement_score, p_engagement_score),
    updated_at = NOW();
  
  -- Record daily activity for streaks (if it's a meaningful activity)
  IF p_activity_type IN ('view', 'complete', 'comment') THEN
    PERFORM record_daily_activity(
      p_user_id,
      p_activity_type,
      GREATEST(1, COALESCE(p_duration_seconds, 60) / 60), -- Convert to minutes
      p_engagement_score
    );
  END IF;
  
  -- Check for achievements (async in real implementation)
  PERFORM check_and_award_achievements(p_user_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard data (comprehensive overview)
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  stats_data RECORD;
  streak_data RECORD;
  goals_data RECORD;
  recent_achievements_json JSON;
  profile_summary RECORD;
BEGIN
  -- Get user stats
  SELECT * FROM get_enhanced_user_stats(user_id_param) INTO stats_data;
  
  -- Get streak info
  SELECT * FROM get_user_streaks(user_id_param) LIMIT 1 INTO streak_data;
  
  -- Get active goals count
  SELECT 
    COUNT(*) as active_goals_count,
    COUNT(*) FILTER (WHERE progress_percentage >= 100) as completed_goals_count
  FROM user_goals 
  WHERE user_id = user_id_param AND goal_type = 'career' AND status = 'active'
  INTO goals_data;
  
  -- Get recent achievements as JSON
  SELECT COALESCE(json_agg(
    json_build_object(
      'title', title,
      'description', description,
      'earned_at', earned_at
    )
  ), '[]'::json) FROM (
    SELECT title, description, earned_at 
    FROM user_achievements 
    WHERE user_id = user_id_param 
    ORDER BY earned_at DESC 
    LIMIT 3
  ) recent INTO recent_achievements_json;
  
  -- Get profile summary
  SELECT * FROM get_user_profile_summary(user_id_param) INTO profile_summary;
  
  -- Build JSON response
  SELECT json_build_object(
    'user_stats', json_build_object(
      'minutes_learned', stats_data.minutes_learned,
      'content_engaged', stats_data.content_pieces_engaged,
      'total_interactions', stats_data.posts_liked + stats_data.posts_saved,
      'achievements_count', stats_data.achievements_earned,
      'skills_count', stats_data.skills_count
    ),
    'streak_info', json_build_object(
      'current_streak', COALESCE(streak_data.current_streak, 0),
      'target_days', COALESCE(streak_data.target_days, 7),
      'progress_message', COALESCE(streak_data.progress_message, 'Start your learning streak!'),
      'is_goal_achieved', COALESCE(streak_data.is_goal_achieved, false)
    ),
    'goals_summary', json_build_object(
      'active_goals', COALESCE(goals_data.active_goals_count, 0),
      'completed_goals', COALESCE(goals_data.completed_goals_count, 0)
    ),
    'profile_completion', profile_summary.profile_completion,
    'monthly_progress', stats_data.monthly_progress_percentage,
    'recent_achievements', recent_achievements_json
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to handle onboarding completion
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
  -- Set up learning streak
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

-- Function to update user streak goal (for profile editing)
CREATE OR REPLACE FUNCTION update_user_streak_goal(
  p_user_id UUID,
  p_new_target_days INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_streaks 
  SET 
    target_days = p_new_target_days,
    updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create indexes to support the new functions
CREATE INDEX IF NOT EXISTS idx_user_content_interactions_activity_type 
  ON user_content_interactions USING gin(interaction_types);

CREATE INDEX IF NOT EXISTS idx_user_goals_type_status_priority 
  ON user_goals(user_id, goal_type, status, priority);

CREATE INDEX IF NOT EXISTS idx_user_achievements_recent 
  ON user_achievements(user_id, earned_at DESC);

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_enhanced_user_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_career_goals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_streaks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_user_activity(UUID, TEXT, BIGINT, TEXT, INTEGER, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_user_onboarding(UUID, TEXT[], TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak_goal(UUID, INTEGER) TO authenticated;

COMMIT;

-- Usage Examples (for reference):
/*

-- Get enhanced user stats (replacement for old get_user_stats)
SELECT * FROM get_enhanced_user_stats('user-uuid');

-- Get user's career goals (no longer mixed with streak goals)
SELECT * FROM get_user_career_goals('user-uuid');

-- Get user's streak information
SELECT * FROM get_user_streaks('user-uuid');

-- Get complete profile summary
SELECT * FROM get_user_profile_summary('user-uuid');

-- Record user activity (comprehensive tracking)
SELECT record_user_activity('user-uuid', 'article', 123, 'view', 180, 7.5);

-- Get dashboard data (JSON response for frontend)
SELECT get_user_dashboard_data('user-uuid');

-- Complete onboarding with new structure
SELECT complete_user_onboarding(
  'user-uuid',
  ARRAY['Technology', 'Finance'],
  'Software Engineer',
  'Google',
  'Junior Developer',
  'Startup Inc',
  7
);

-- Update streak goal
SELECT update_user_streak_goal('user-uuid', 5);

*/