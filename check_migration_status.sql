-- Check migration status and logs
BEGIN;

-- Check if migration_log table exists and has data
SELECT 
  'Migration log entries:' as debug_info,
  user_id,
  old_goal,
  old_timeframe,
  extracted_days,
  migration_action,
  created_at
FROM migration_log 
ORDER BY created_at DESC;

-- Check current state of user_goals that should be migrated
SELECT 
  'Current user_goals state:' as debug_info,
  user_id,
  goal,
  timeframe,
  goal_type,
  status,
  description
FROM user_goals 
WHERE (
  goal ILIKE '%weekly learning goal%' OR
  goal ILIKE '%day%streak%' OR
  goal ILIKE '%daily%learning%' OR
  goal ILIKE '%day%goal%' OR
  timeframe = 'weekly' OR
  goal ~ '\d+\s*days?'
)
ORDER BY created_at DESC;

-- Check if any streaks were actually created
SELECT 
  'User streaks created:' as debug_info,
  user_id,
  streak_type,
  target_days,
  current_streak,
  streak_goal_set_at,
  is_active
FROM user_streaks
ORDER BY streak_goal_set_at DESC;

-- Manual test of the migration function
SELECT 
  'Testing migration function:' as debug_info,
  * 
FROM migrate_streak_goals();

ROLLBACK;