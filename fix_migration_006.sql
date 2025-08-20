-- Fixed migration script to properly migrate streak goals
BEGIN;

-- Create a regular table (not temp) to track migration for debugging
CREATE TABLE IF NOT EXISTS migration_results_log (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  old_goal TEXT,
  old_timeframe TEXT,
  extracted_days INTEGER,
  migration_action TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Simple, direct migration approach
DO $$
DECLARE
  goal_record RECORD;
  target_days INTEGER;
  migration_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting streak goals migration...';
  
  -- Process each streak-like goal
  FOR goal_record IN 
    SELECT user_id, goal, timeframe, created_at
    FROM user_goals
    WHERE (
      goal ILIKE '%weekly learning goal%' OR
      goal ILIKE '%day%streak%' OR
      goal ILIKE '%daily%learning%' OR
      goal ILIKE '%day%goal%' OR
      timeframe = 'weekly' OR
      goal ~ '\d+\s*days?'
    )
    AND NOT EXISTS (
      SELECT 1 FROM user_streaks 
      WHERE user_streaks.user_id = user_goals.user_id 
      AND is_active = true
    )
  LOOP
    BEGIN
      -- Extract target days from goal text
      target_days := 7; -- Default to 7 days
      
      -- Try to extract number from goal text
      IF goal_record.goal ~ '\d+' THEN
        target_days := (regexp_match(goal_record.goal, '(\d+)'))[1]::INTEGER;
        -- Ensure reasonable range
        IF target_days < 1 OR target_days > 30 THEN
          target_days := 7;
        END IF;
      END IF;
      
      RAISE NOTICE 'Migrating goal for user %: % -> % days', goal_record.user_id, goal_record.goal, target_days;
      
      -- Insert into user_streaks
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
        goal_record.user_id,
        'daily_learning',
        target_days,
        0, -- Start fresh
        0, -- Start fresh
        NULL, -- No activity yet
        COALESCE(goal_record.created_at, NOW()),
        TRUE
      );
      
      -- Update the original goal to mark as migrated
      UPDATE user_goals 
      SET 
        goal_type = 'learning',
        status = 'completed',
        description = 'Migrated to user_streaks table: ' || goal,
        updated_at = NOW()
      WHERE user_id = goal_record.user_id 
        AND goal = goal_record.goal;
      
      -- Log success
      INSERT INTO migration_results_log (user_id, old_goal, old_timeframe, extracted_days, migration_action)
      VALUES (goal_record.user_id, goal_record.goal, goal_record.timeframe, target_days, 'SUCCESS');
      
      migration_count := migration_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error
      INSERT INTO migration_results_log (user_id, old_goal, old_timeframe, extracted_days, migration_action)
      VALUES (goal_record.user_id, goal_record.goal, goal_record.timeframe, target_days, 'ERROR: ' || SQLERRM);
      
      error_count := error_count + 1;
      RAISE NOTICE 'Error migrating goal for user %: %', goal_record.user_id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Migration completed: % successful, % errors', migration_count, error_count;
END $$;

-- Show results
SELECT 
  'Migration Results:' as info,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE migration_action = 'SUCCESS') as successful_migrations,
  COUNT(*) FILTER (WHERE migration_action LIKE 'ERROR:%') as failed_migrations
FROM migration_results_log;

-- Show the migrated streaks
SELECT 
  'Created Streaks:' as info,
  user_id,
  streak_type,
  target_days,
  streak_goal_set_at
FROM user_streaks
ORDER BY streak_goal_set_at DESC;

-- Show updated goals
SELECT 
  'Updated Goals:' as info,
  user_id,
  goal,
  goal_type,
  status,
  description
FROM user_goals 
WHERE status = 'completed' AND description LIKE 'Migrated to user_streaks%';

COMMIT;