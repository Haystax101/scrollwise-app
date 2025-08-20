-- Verify the migration is complete and working
BEGIN;

-- Check the current state
SELECT 
  'User Goals (Career only):' as table_info,
  COUNT(*) as total_goals,
  COUNT(*) FILTER (WHERE goal_type = 'career') as career_goals,
  COUNT(*) FILTER (WHERE goal IS NOT NULL AND goal != '') as goals_with_content,
  COUNT(*) FILTER (WHERE status = 'active') as active_goals
FROM user_goals;

SELECT 
  'User Streaks:' as table_info,
  COUNT(*) as total_streaks,
  COUNT(*) FILTER (WHERE is_active = true) as active_streaks,
  COUNT(*) FILTER (WHERE streak_type = 'daily_learning') as daily_learning_streaks,
  AVG(target_days) as avg_target_days
FROM user_streaks;

-- Test the new functions work
SELECT 
  'Testing enhanced stats function:' as test_info,
  user_id,
  current_streak,
  longest_streak,
  monthly_progress_percentage
FROM get_enhanced_user_stats((SELECT user_id FROM user_streaks LIMIT 1));

SELECT 
  'Testing career goals function:' as test_info,
  COUNT(*) as career_goals_found
FROM get_user_career_goals((SELECT user_id FROM user_goals WHERE goal_type = 'career' LIMIT 1));

SELECT 
  'Testing streak function:' as test_info,
  user_id,
  streak_type,
  current_streak,
  target_days,
  progress_message
FROM get_user_streaks((SELECT user_id FROM user_streaks LIMIT 1));

ROLLBACK;