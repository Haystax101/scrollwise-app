-- Migration 006: Migrate Streak Goals from User Goals
-- This migration addresses the critical issue of streak goals being incorrectly stored in user_goals table
-- Moves streak-related goals to the dedicated user_streaks table

BEGIN;

-- Create a temporary table to log migration results
CREATE TEMP TABLE migration_log (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  old_goal TEXT,
  old_timeframe TEXT,
  extracted_days INTEGER,
  migration_action TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Function to extract days from goal text
CREATE OR REPLACE FUNCTION extract_days_from_goal_text(goal_text TEXT)
RETURNS INTEGER AS $$
DECLARE
  days_value INTEGER;
BEGIN
  -- Try to extract number from various patterns
  -- "Weekly learning goal: 7 days" -> 7
  -- "Weekly learning goal: 3 days" -> 3
  -- "7 day streak" -> 7
  -- "3-day weekly goal" -> 3
  
  -- Pattern 1: "goal: X days"
  days_value := (regexp_match(goal_text, 'goal:\s*(\d+)\s*days?', 'i'))[1]::INTEGER;
  IF days_value IS NOT NULL THEN
    RETURN days_value;
  END IF;
  
  -- Pattern 2: "X day streak"
  days_value := (regexp_match(goal_text, '(\d+)\s*day\s*streak', 'i'))[1]::INTEGER;
  IF days_value IS NOT NULL THEN
    RETURN days_value;
  END IF;
  
  -- Pattern 3: "X-day goal"
  days_value := (regexp_match(goal_text, '(\d+)[-\s]*day\s*', 'i'))[1]::INTEGER;
  IF days_value IS NOT NULL THEN
    RETURN days_value;
  END IF;
  
  -- Pattern 4: Just a number followed by days
  days_value := (regexp_match(goal_text, '(\d+)\s*days?', 'i'))[1]::INTEGER;
  IF days_value IS NOT NULL THEN
    RETURN days_value;
  END IF;
  
  -- Default fallback based on timeframe
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to determine streak type from goal and timeframe
CREATE OR REPLACE FUNCTION determine_streak_type(goal_text TEXT, timeframe TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Always default to daily_learning for now
  -- Could be enhanced later for different streak types
  RETURN 'daily_learning';
END;
$$ LANGUAGE plpgsql;

-- Main migration function
CREATE OR REPLACE FUNCTION migrate_streak_goals()
RETURNS TABLE (
  total_goals_checked INTEGER,
  streak_goals_found INTEGER,
  successfully_migrated INTEGER,
  migration_errors INTEGER
) AS $$
DECLARE
  goal_record RECORD;
  extracted_days INTEGER;
  streak_type TEXT;
  total_checked INTEGER := 0;
  streak_found INTEGER := 0;
  successful_migrations INTEGER := 0;
  migration_errors INTEGER := 0;
BEGIN
  -- Process each goal in user_goals table
  FOR goal_record IN 
    SELECT user_id, goal, timeframe, created_at
    FROM user_goals
    WHERE goal IS NOT NULL
  LOOP
    total_checked := total_checked + 1;
    
    -- Check if this looks like a streak goal
    IF (
      goal_record.goal ILIKE '%weekly learning goal%' OR
      goal_record.goal ILIKE '%day%streak%' OR
      goal_record.goal ILIKE '%daily%learning%' OR
      goal_record.goal ILIKE '%day%goal%' OR
      goal_record.timeframe = 'weekly' OR
      goal_record.goal ~ '\d+\s*days?'
    ) THEN
      streak_found := streak_found + 1;
      
      -- Extract target days
      extracted_days := extract_days_from_goal_text(goal_record.goal);
      
      -- Default to 7 days if we can't extract or if extraction seems wrong
      IF extracted_days IS NULL OR extracted_days < 1 OR extracted_days > 365 THEN
        -- Use timeframe as fallback
        CASE goal_record.timeframe
          WHEN 'weekly' THEN extracted_days := 7;
          WHEN 'daily' THEN extracted_days := 1;
          WHEN 'monthly' THEN extracted_days := 30;
          ELSE extracted_days := 7; -- Default weekly
        END CASE;
      END IF;
      
      -- Determine streak type
      streak_type := determine_streak_type(goal_record.goal, goal_record.timeframe);
      
      BEGIN
        -- Insert into user_streaks table
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
          streak_type,
          extracted_days,
          0, -- Start fresh
          0, -- Start fresh
          NULL, -- No activity yet
          COALESCE(goal_record.created_at, NOW()),
          TRUE
        ) ON CONFLICT (user_id, streak_type) DO UPDATE SET
          target_days = EXCLUDED.target_days,
          streak_goal_set_at = EXCLUDED.streak_goal_set_at,
          updated_at = NOW();
        
        -- Mark the original goal as migrated (update goal_type to 'streak')
        UPDATE user_goals 
        SET 
          goal_type = 'learning', -- Changed from 'streak' to 'learning' since we're migrating away
          status = 'completed',
          description = 'Migrated to user_streaks table: ' || goal,
          updated_at = NOW()
        WHERE user_id = goal_record.user_id AND goal = goal_record.goal;
        
        -- Log successful migration
        INSERT INTO migration_log (user_id, old_goal, old_timeframe, extracted_days, migration_action)
        VALUES (goal_record.user_id, goal_record.goal, goal_record.timeframe, extracted_days, 'SUCCESS');
        
        successful_migrations := successful_migrations + 1;
        
      EXCEPTION WHEN OTHERS THEN
        -- Log error
        INSERT INTO migration_log (user_id, old_goal, old_timeframe, extracted_days, migration_action)
        VALUES (goal_record.user_id, goal_record.goal, goal_record.timeframe, extracted_days, 'ERROR: ' || SQLERRM);
        
        migration_errors := migration_errors + 1;
      END;
    END IF;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT total_checked, streak_found, successful_migrations, migration_errors;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up migrated goals (optional - run after verification)
CREATE OR REPLACE FUNCTION cleanup_migrated_streak_goals()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete goals that have been successfully migrated to streaks
  DELETE FROM user_goals 
  WHERE goal_type = 'learning' 
    AND status = 'completed' 
    AND description LIKE 'Migrated to user_streaks table:%';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to verify migration results
CREATE OR REPLACE FUNCTION verify_migration_results()
RETURNS TABLE (
  user_count_with_streaks INTEGER,
  user_count_with_old_goals INTEGER,
  total_streaks_created INTEGER,
  migration_success_rate DECIMAL
) AS $$
DECLARE
  users_with_streaks INTEGER;
  users_with_old_goals INTEGER;
  total_streaks INTEGER;
  success_rate DECIMAL;
BEGIN
  -- Count users with streaks
  SELECT COUNT(DISTINCT user_id) FROM user_streaks WHERE is_active = true INTO users_with_streaks;
  
  -- Count users with old streak-style goals
  SELECT COUNT(DISTINCT user_id) FROM user_goals 
  WHERE (goal ILIKE '%weekly learning goal%' OR goal ILIKE '%day%streak%' OR goal ILIKE '%daily%learning%')
    AND goal_type != 'learning' INTO users_with_old_goals;
  
  -- Count total streaks created
  SELECT COUNT(*) FROM user_streaks WHERE is_active = true INTO total_streaks;
  
  -- Calculate success rate from migration log
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE migration_action = 'SUCCESS')::DECIMAL / COUNT(*) * 100)
    END
  FROM migration_log INTO success_rate;
  
  RETURN QUERY SELECT users_with_streaks, users_with_old_goals, total_streaks, COALESCE(success_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
DO $$
DECLARE
  migration_results RECORD;
BEGIN
  RAISE NOTICE 'Starting streak goals migration...';
  
  -- Run the migration
  SELECT * FROM migrate_streak_goals() INTO migration_results;
  
  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '  Total goals checked: %', migration_results.total_goals_checked;
  RAISE NOTICE '  Streak goals found: %', migration_results.streak_goals_found;
  RAISE NOTICE '  Successfully migrated: %', migration_results.successfully_migrated;
  RAISE NOTICE '  Migration errors: %', migration_results.migration_errors;
  
  -- Show migration log for review
  RAISE NOTICE 'Migration details:';
  PERFORM 1 FROM migration_log ORDER BY id;
END $$;

-- Create view for easy migration review
CREATE OR REPLACE VIEW migration_review AS
SELECT 
  ml.user_id,
  p.full_name,
  ml.old_goal,
  ml.old_timeframe,
  ml.extracted_days,
  ml.migration_action,
  us.streak_type,
  us.target_days,
  us.is_active as streak_active,
  ml.created_at as migration_time
FROM migration_log ml
LEFT JOIN profiles p ON ml.user_id = p.id
LEFT JOIN user_streaks us ON ml.user_id = us.user_id 
  AND us.streak_type = 'daily_learning' 
  AND us.is_active = true
ORDER BY ml.created_at DESC;

-- Grant permissions for review
GRANT SELECT ON migration_review TO authenticated;
GRANT EXECUTE ON FUNCTION verify_migration_results() TO authenticated;

-- Show verification results
SELECT 
  'Migration Verification Results' as info,
  * 
FROM verify_migration_results();

COMMIT;

-- Post-migration instructions:
/*

-- 1. Review migration results:
SELECT * FROM migration_review;

-- 2. Verify migration success:
SELECT * FROM verify_migration_results();

-- 3. Check some examples of migrated streaks:
SELECT 
  p.full_name,
  us.streak_type,
  us.target_days,
  us.current_streak,
  us.streak_goal_set_at
FROM user_streaks us
JOIN profiles p ON us.user_id = p.id
WHERE us.is_active = true
LIMIT 10;

-- 4. After verification, optionally clean up old goals:
-- SELECT cleanup_migrated_streak_goals();

-- 5. Drop temporary functions if no longer needed:
-- DROP FUNCTION IF EXISTS extract_days_from_goal_text(TEXT);
-- DROP FUNCTION IF EXISTS determine_streak_type(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS migrate_streak_goals();
-- DROP FUNCTION IF EXISTS cleanup_migrated_streak_goals();

*/