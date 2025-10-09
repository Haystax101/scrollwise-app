-- Quick fix for existing zero streaks
-- Run this immediately to fix any streaks that are currently showing 0

-- Fix user_streaks table
UPDATE user_streaks
SET
  current_streak = 1,
  longest_streak = GREATEST(longest_streak, 1),
  last_activity_date = CURRENT_DATE, -- Set to today so they get credit for logging in
  updated_at = NOW()
WHERE current_streak = 0 AND streak_type = 'daily_learning';

-- Fix legacy profiles table
UPDATE profiles
SET days_streak = 1
WHERE days_streak = 0;

-- Create any missing streak records for users who don't have them
INSERT INTO user_streaks (user_id, streak_type, target_days, current_streak, longest_streak, last_activity_date)
SELECT
  id as user_id,
  'daily_learning' as streak_type,
  30 as target_days,
  1 as current_streak, -- Start with 1
  1 as longest_streak,
  CURRENT_DATE as last_activity_date
FROM profiles
WHERE id NOT IN (
  SELECT user_id FROM user_streaks
  WHERE streak_type = 'daily_learning'
);

-- Show results
SELECT
  COUNT(*) as total_streaks,
  MIN(current_streak) as min_streak,
  MAX(current_streak) as max_streak,
  AVG(current_streak) as avg_streak
FROM user_streaks
WHERE streak_type = 'daily_learning';

-- Verify no zero streaks remain
SELECT COUNT(*) as zero_streaks_remaining
FROM user_streaks
WHERE current_streak = 0 AND streak_type = 'daily_learning';

SELECT CASE
  WHEN COUNT(*) = 0 THEN '✅ Success: No zero streaks found!'
  ELSE '❌ Warning: ' || COUNT(*) || ' zero streaks still exist'
END as status
FROM user_streaks
WHERE current_streak = 0 AND streak_type = 'daily_learning';