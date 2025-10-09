-- Fix Zero Streak Database Constraints
-- This ensures database enforces minimum streak value of 1

-- Step 1: Fix existing zero streaks first (data migration)
UPDATE user_streaks
SET
  current_streak = GREATEST(current_streak, 1),
  longest_streak = GREATEST(longest_streak, 1)
WHERE current_streak = 0 OR longest_streak = 0;

-- Step 2: Update constraints to prevent future zero streaks
ALTER TABLE user_streaks DROP CONSTRAINT IF EXISTS user_streaks_current_streak_check;
ALTER TABLE user_streaks ADD CONSTRAINT user_streaks_current_streak_check CHECK (current_streak >= 1);

ALTER TABLE user_streaks DROP CONSTRAINT IF EXISTS user_streaks_longest_streak_check;
ALTER TABLE user_streaks ADD CONSTRAINT user_streaks_longest_streak_check CHECK (longest_streak >= 1);

-- Step 3: Make target_days have a sensible default
ALTER TABLE user_streaks ALTER COLUMN target_days SET DEFAULT 30;

-- Step 4: Verify the fixes
SELECT
  'CONSTRAINT FIXES APPLIED' as status,
  'Zero streaks are now prevented at database level' as message;

-- Check for any remaining zero streaks (should be 0)
SELECT
  COUNT(*) as zero_streaks_remaining,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No zero streaks found'
    ELSE '❌ WARNING: ' || COUNT(*) || ' zero streaks still exist'
  END as zero_streak_status
FROM user_streaks
WHERE current_streak = 0 OR longest_streak = 0;

-- Check constraint is working
SELECT
  conname as constraint_name,
  consrc as constraint_definition
FROM pg_constraint
WHERE conname LIKE '%streak_check%'
AND conrelid = 'user_streaks'::regclass;

SELECT
  '🎉 DATABASE CONSTRAINTS UPDATED!' as final_status,
  'Streaks are now enforced to be minimum 1 at database level' as result;