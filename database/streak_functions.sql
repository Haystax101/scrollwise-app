-- Simplified Daily Streaks Implementation
-- This file contains all the database functions needed for daily streak tracking

-- Function: Update user streak on daily activity (simplified for daily learning only)
DROP FUNCTION IF EXISTS update_user_streak(UUID, DATE);
CREATE FUNCTION update_user_streak(
  user_id_param UUID,
  activity_date_param DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
DECLARE
  last_activity_date DATE;
  current_streak_count INTEGER;
  streak_record RECORD;
BEGIN
  -- Validate input parameters
  IF user_id_param IS NULL THEN
    RAISE WARNING 'update_user_streak: user_id_param is NULL';
    RETURN FALSE;
  END IF;
  -- Get current streak record (only daily_learning type)
  SELECT * INTO streak_record
  FROM user_streaks
  WHERE user_id = user_id_param
    AND streak_type = 'daily_learning'
    AND is_active = true;

  IF NOT FOUND THEN
    -- Initialize streak record if doesn't exist
    INSERT INTO user_streaks (
      user_id,
      streak_type,
      target_days,
      current_streak,
      longest_streak,
      last_activity_date
    ) VALUES (
      user_id_param,
      'daily_learning',
      30, -- Default target
      1,
      1,
      activity_date_param
    );

    -- Update legacy profiles.days_streak for backwards compatibility
    UPDATE profiles
    SET days_streak = 1
    WHERE id = user_id_param;

    RETURN TRUE;
  END IF;

  -- Check if activity is on consecutive day
  IF streak_record.last_activity_date = activity_date_param THEN
    -- Same day, no update needed
    RETURN TRUE;
  ELSIF streak_record.last_activity_date = activity_date_param - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    current_streak_count := streak_record.current_streak + 1;
  ELSE
    -- Gap in activity, reset streak to 1 (never 0)
    current_streak_count := 1;
  END IF;

  -- Update streak record
  UPDATE user_streaks
  SET
    current_streak = current_streak_count,
    longest_streak = GREATEST(longest_streak, current_streak_count),
    last_activity_date = activity_date_param,
    updated_at = NOW()
  WHERE user_id = user_id_param
    AND streak_type = 'daily_learning'
    AND is_active = true;

  -- Also update legacy profiles.days_streak for backwards compatibility
  UPDATE profiles
  SET days_streak = current_streak_count
  WHERE id = user_id_param;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Log daily activity and update streak
DROP FUNCTION IF EXISTS log_daily_activity(UUID, TEXT[], DATE);
CREATE FUNCTION log_daily_activity(
  user_id_param UUID,
  activity_types_param TEXT[] DEFAULT ARRAY['app_open'],
  activity_date_param DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
BEGIN
  -- Validate input parameters
  IF user_id_param IS NULL THEN
    RAISE WARNING 'log_daily_activity: user_id_param is NULL';
    RETURN FALSE;
  END IF;
  -- Check if daily activity record exists
  IF EXISTS (
    SELECT 1 FROM user_daily_activities
    WHERE user_id = user_id_param AND activity_date = activity_date_param
  ) THEN
    -- Update existing record
    UPDATE user_daily_activities SET
      activity_types = array_cat(activity_types, activity_types_param),
      total_minutes_active = total_minutes_active + 1,
      interactions_count = interactions_count + 1,
      unique_content_pieces = unique_content_pieces +
        CASE WHEN 'content_view' = ANY(activity_types_param) THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE user_id = user_id_param AND activity_date = activity_date_param;
  ELSE
    -- Insert new record
    INSERT INTO user_daily_activities (
      user_id,
      activity_date,
      activity_types,
      total_minutes_active,
      unique_content_pieces,
      interactions_count
    ) VALUES (
      user_id_param,
      activity_date_param,
      activity_types_param,
      1,
      CASE WHEN 'content_view' = ANY(activity_types_param) THEN 1 ELSE 0 END,
      1
    );
  END IF;

  -- Ensure user has a streak record (initialize if missing)
  IF NOT EXISTS (
    SELECT 1 FROM user_streaks
    WHERE user_id = user_id_param AND streak_type = 'daily_learning' AND is_active = true
  ) THEN
    -- Initialize streak for user
    PERFORM setup_user_learning_streak(user_id_param, 30); -- Default 30 day goal
  END IF;

  -- Update streak
  PERFORM update_user_streak(user_id_param, activity_date_param);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user's current streak info
DROP FUNCTION IF EXISTS get_user_streak_info(UUID);
CREATE FUNCTION get_user_streak_info(user_id_param UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  target_days INTEGER,
  last_activity_date DATE,
  days_until_reset INTEGER,
  is_active_today BOOLEAN
) AS $$
BEGIN
  -- Validate input parameters
  IF user_id_param IS NULL THEN
    RAISE WARNING 'get_user_streak_info: user_id_param is NULL';
    RETURN QUERY SELECT 1, 1, 30, NULL::DATE, 1, false;
    RETURN;
  END IF;
  RETURN QUERY
  SELECT
    GREATEST(COALESCE(us.current_streak, 1), 1) as current_streak, -- Ensure never 0
    GREATEST(COALESCE(us.longest_streak, 1), 1) as longest_streak, -- Ensure never 0
    COALESCE(us.target_days, 30) as target_days,
    us.last_activity_date,
    CASE
      WHEN us.last_activity_date = CURRENT_DATE THEN 0
      WHEN us.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN 0
      ELSE 1 -- Will reset tomorrow if no activity today
    END as days_until_reset,
    COALESCE(us.last_activity_date = CURRENT_DATE, false) as is_active_today
  FROM user_streaks us
  WHERE us.user_id = user_id_param
    AND us.streak_type = 'daily_learning'
    AND us.is_active = true

  UNION ALL

  -- If no streak record exists, return defaults (minimum 1)
  SELECT 1, 1, 30, NULL::DATE, 1, false
  WHERE NOT EXISTS (
    SELECT 1 FROM user_streaks
    WHERE user_id = user_id_param
      AND streak_type = 'daily_learning'
      AND is_active = true
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Initialize streak for new users (used in onboarding)
DROP FUNCTION IF EXISTS setup_user_learning_streak(UUID, INTEGER);
CREATE FUNCTION setup_user_learning_streak(
  user_id_param UUID,
  target_days_param INTEGER DEFAULT 30
) RETURNS BOOLEAN AS $$
BEGIN
  -- Validate input parameters
  IF user_id_param IS NULL THEN
    RAISE WARNING 'setup_user_learning_streak: user_id_param is NULL';
    RETURN FALSE;
  END IF;
  -- Check if streak record exists
  IF EXISTS (
    SELECT 1 FROM user_streaks
    WHERE user_id = user_id_param AND streak_type = 'daily_learning'
  ) THEN
    -- Update existing record
    UPDATE user_streaks SET
      target_days = target_days_param,
      is_active = true,
      updated_at = NOW()
    WHERE user_id = user_id_param AND streak_type = 'daily_learning';
  ELSE
    -- Insert new record
    INSERT INTO user_streaks (
      user_id,
      streak_type,
      target_days,
      current_streak,
      longest_streak,
      last_activity_date,
      is_active
    ) VALUES (
      user_id_param,
      'daily_learning',
      target_days_param,
      1, -- Start with 1, never 0
      1,
      CURRENT_DATE, -- Consider onboarding as first activity
      true
    );
  END IF;

  -- Also initialize daily activity record for today
  PERFORM log_daily_activity(user_id_param, ARRAY['onboarding'], CURRENT_DATE);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers first (required before dropping the function)
DROP TRIGGER IF EXISTS learning_session_streak_update ON learning_sessions;
DROP TRIGGER IF EXISTS learning_session_streak_update_2025_08 ON learning_sessions_2025_08;
DROP TRIGGER IF EXISTS learning_session_streak_update_2025_09 ON learning_sessions_2025_09;
DROP TRIGGER IF EXISTS learning_session_streak_update_2025_10 ON learning_sessions_2025_10;
DROP TRIGGER IF EXISTS learning_session_streak_update_partitioned ON learning_sessions_partitioned;

-- Trigger: Auto-update streak on learning session completion
DROP FUNCTION IF EXISTS trigger_update_streak_on_session();
CREATE FUNCTION trigger_update_streak_on_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update streak for completed sessions
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    PERFORM log_daily_activity(
      NEW.user_id,
      ARRAY['learning_session', NEW.content_type],
      DATE(NEW.session_start_time AT TIME ZONE 'GMT')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on all learning sessions tables (after function is created)
CREATE TRIGGER learning_session_streak_update
  AFTER UPDATE ON learning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak_on_session();

CREATE TRIGGER learning_session_streak_update_2025_08
  AFTER UPDATE ON learning_sessions_2025_08
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak_on_session();

CREATE TRIGGER learning_session_streak_update_2025_09
  AFTER UPDATE ON learning_sessions_2025_09
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak_on_session();

CREATE TRIGGER learning_session_streak_update_2025_10
  AFTER UPDATE ON learning_sessions_2025_10
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak_on_session();

CREATE TRIGGER learning_session_streak_update_partitioned
  AFTER UPDATE ON learning_sessions_partitioned
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak_on_session();

-- Create unique constraint to prevent duplicate streaks per user/type
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_streaks_unique_active
ON user_streaks(user_id, streak_type)
WHERE is_active = true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_type
ON user_streaks(user_id, streak_type);

CREATE INDEX IF NOT EXISTS idx_user_daily_activities_user_date
ON user_daily_activities(user_id, activity_date);

-- Also ensure unique constraint on user_daily_activities
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_daily_activities_unique
ON user_daily_activities(user_id, activity_date);

-- Migration: Set up streaks for existing users
INSERT INTO user_streaks (user_id, streak_type, target_days, current_streak, longest_streak, last_activity_date)
SELECT
  id as user_id,
  'daily_learning' as streak_type,
  30 as target_days, -- Default goal
  GREATEST(COALESCE(days_streak, 1), 1) as current_streak, -- Ensure minimum 1
  GREATEST(COALESCE(days_streak, 1), 1) as longest_streak,
  CURRENT_DATE as last_activity_date -- Assume recent activity
FROM profiles
WHERE id NOT IN (
  SELECT user_id FROM user_streaks
  WHERE streak_type = 'daily_learning'
);

-- Fix any existing streaks that might be 0
UPDATE user_streaks
SET
  current_streak = 1,
  longest_streak = GREATEST(longest_streak, 1),
  updated_at = NOW()
WHERE current_streak = 0 AND streak_type = 'daily_learning';

-- Also fix legacy profiles table
UPDATE profiles
SET days_streak = 1
WHERE days_streak = 0;