-- Simple test to run the migration manually and see what happens
BEGIN;

-- Create a temporary table to log results for this session
CREATE TEMP TABLE test_migration_log (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  old_goal TEXT,
  old_timeframe TEXT,
  extracted_days INTEGER,
  migration_action TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Test the extraction function on actual data
SELECT 
  'Testing extraction function:' as debug_info,
  goal,
  extract_days_from_goal_text(goal) as extracted_days
FROM user_goals 
WHERE (
  goal ILIKE '%weekly learning goal%' OR
  goal ILIKE '%day%streak%' OR
  goal ILIKE '%daily%learning%' OR
  goal ILIKE '%day%goal%' OR
  timeframe = 'weekly' OR
  goal ~ '\d+\s*days?'
)
LIMIT 5;

-- Try to manually insert a streak for one user to test the table
DO $$
DECLARE
  test_user_id UUID;
  test_goal_text TEXT;
BEGIN
  -- Get first streak goal
  SELECT user_id, goal FROM user_goals 
  WHERE (
    goal ILIKE '%weekly learning goal%' OR
    goal ILIKE '%day%streak%' OR
    timeframe = 'weekly'
  )
  LIMIT 1
  INTO test_user_id, test_goal_text;
  
  IF test_user_id IS NOT NULL THEN
    -- Try to insert into user_streaks
    INSERT INTO user_streaks (
      user_id,
      streak_type,
      target_days,
      current_streak,
      longest_streak,
      last_activity_date,
      streak_goal_set_at,
      is_active
    ) VALUES (
      test_user_id,
      'daily_learning',
      7, -- default 7 days
      0,
      0,
      NULL,
      NOW(),
      TRUE
    );
    
    INSERT INTO test_migration_log (user_id, old_goal, migration_action)
    VALUES (test_user_id, test_goal_text, 'MANUAL_TEST_SUCCESS');
    
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO test_migration_log (user_id, old_goal, migration_action)
  VALUES (test_user_id, test_goal_text, 'ERROR: ' || SQLERRM);
END $$;

-- Show results
SELECT * FROM test_migration_log;
SELECT * FROM user_streaks;

ROLLBACK;