-- Test script for streak functionality
-- Run this after deploying streak_functions.sql to validate implementation

-- Pre-test validation: Check for function conflicts
DO $$
DECLARE
    setup_function_count INTEGER;
    all_function_count INTEGER;
BEGIN
    -- Count setup_user_learning_streak functions
    SELECT COUNT(*) INTO setup_function_count
    FROM pg_proc
    WHERE proname = 'setup_user_learning_streak';

    -- Count all streak functions
    SELECT COUNT(*) INTO all_function_count
    FROM pg_proc
    WHERE proname IN ('update_user_streak', 'log_daily_activity', 'get_user_streak_info', 'setup_user_learning_streak', 'trigger_update_streak_on_session');

    RAISE NOTICE '🔍 Pre-test validation:';
    RAISE NOTICE '   setup_user_learning_streak functions: %', setup_function_count;
    RAISE NOTICE '   Total streak functions: %', all_function_count;

    IF setup_function_count > 1 THEN
        RAISE WARNING '⚠️ Multiple setup_user_learning_streak functions detected!';
        RAISE WARNING '   Run cleanup_duplicate_functions.sql first, then redeploy streak_functions.sql';
        RAISE EXCEPTION 'Cannot proceed with testing due to function conflicts';
    END IF;

    IF all_function_count != 5 THEN
        RAISE WARNING '⚠️ Expected 5 streak functions, found %', all_function_count;
        RAISE WARNING '   Deploy streak_functions.sql first';
        RAISE EXCEPTION 'Cannot proceed with testing - incomplete function set';
    END IF;

    RAISE NOTICE '✅ Function validation passed - proceeding with tests';
END $$;

-- Test 1: Initialize streak for a test user
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  result BOOLEAN;
BEGIN
  -- Test streak initialization (with explicit type cast)
  SELECT setup_user_learning_streak(test_user_id, 30::INTEGER) INTO result;
  RAISE NOTICE 'Streak initialization result: %', result;

  -- Verify streak was created
  IF EXISTS (
    SELECT 1 FROM user_streaks
    WHERE user_id = test_user_id
      AND streak_type = 'daily_learning'
      AND target_days = 30
      AND current_streak = 1
  ) THEN
    RAISE NOTICE '✅ Test 1 PASSED: Streak initialization works';
  ELSE
    RAISE NOTICE '❌ Test 1 FAILED: Streak initialization failed';
  END IF;
END $$;

-- Test 2: Log daily activity and check streak increment
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  result BOOLEAN;
  streak_info RECORD;
BEGIN
  -- Log activity for tomorrow (simulate next day)
  SELECT log_daily_activity(test_user_id, ARRAY['learning_activity'], CURRENT_DATE + INTERVAL '1 day') INTO result;
  RAISE NOTICE 'Daily activity logging result: %', result;

  -- Check if streak incremented
  SELECT * FROM get_user_streak_info(test_user_id) INTO streak_info;

  IF streak_info.current_streak = 2 THEN
    RAISE NOTICE '✅ Test 2 PASSED: Streak increments correctly';
  ELSE
    RAISE NOTICE '❌ Test 2 FAILED: Expected streak 2, got %', streak_info.current_streak;
  END IF;
END $$;

-- Test 3: Test streak reset after gap
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  result BOOLEAN;
  streak_info RECORD;
BEGIN
  -- Log activity 3 days later (should reset streak to 1)
  SELECT log_daily_activity(test_user_id, ARRAY['learning_activity'], CURRENT_DATE + INTERVAL '4 days') INTO result;

  -- Check if streak reset to 1 (not 0)
  SELECT * FROM get_user_streak_info(test_user_id) INTO streak_info;

  IF streak_info.current_streak = 1 THEN
    RAISE NOTICE '✅ Test 3 PASSED: Streak resets to 1 after gap';
  ELSE
    RAISE NOTICE '❌ Test 3 FAILED: Expected streak 1 after gap, got %', streak_info.current_streak;
  END IF;

  -- Check that longest streak is preserved
  IF streak_info.longest_streak = 2 THEN
    RAISE NOTICE '✅ Test 3 PASSED: Longest streak preserved';
  ELSE
    RAISE NOTICE '❌ Test 3 FAILED: Expected longest streak 2, got %', streak_info.longest_streak;
  END IF;
END $$;

-- Test 4: Test same-day activity (no duplicate)
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  result BOOLEAN;
  streak_info RECORD;
  prev_streak INTEGER;
BEGIN
  -- Get current streak
  SELECT current_streak FROM get_user_streak_info(test_user_id) INTO prev_streak;

  -- Log activity for same day again
  SELECT log_daily_activity(test_user_id, ARRAY['app_open'], CURRENT_DATE + INTERVAL '4 days') INTO result;

  -- Check streak didn't change
  SELECT * FROM get_user_streak_info(test_user_id) INTO streak_info;

  IF streak_info.current_streak = prev_streak THEN
    RAISE NOTICE '✅ Test 4 PASSED: Same-day activity does not duplicate streak';
  ELSE
    RAISE NOTICE '❌ Test 4 FAILED: Same-day activity changed streak from % to %', prev_streak, streak_info.current_streak;
  END IF;
END $$;

-- Test 5: Test learning session trigger
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  session_id UUID;
  streak_before INTEGER;
  streak_after INTEGER;
BEGIN
  -- Get current streak
  SELECT current_streak FROM get_user_streak_info(test_user_id) INTO streak_before;

  -- Insert a learning session for tomorrow (check if table exists first)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_sessions') THEN
    INSERT INTO learning_sessions (
      user_id, content_type, content_id, session_start_time, is_completed
    ) VALUES (
      test_user_id, 'article', 1, (CURRENT_DATE + INTERVAL '5 days')::timestamp with time zone, false
    ) RETURNING id INTO session_id;
  ELSE
    -- Use partitioned table if main table doesn't exist
    INSERT INTO learning_sessions_partitioned (
      user_id, content_type, content_id, session_start_time, is_completed
    ) VALUES (
      test_user_id, 'article', 1, (CURRENT_DATE + INTERVAL '5 days')::timestamp with time zone, false
    ) RETURNING id INTO session_id;
  END IF;

  -- Complete the session (should trigger streak update)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_sessions') THEN
    UPDATE learning_sessions
    SET is_completed = true
    WHERE id = session_id;
  ELSE
    UPDATE learning_sessions_partitioned
    SET is_completed = true
    WHERE id = session_id;
  END IF;

  -- Check if streak updated
  SELECT current_streak FROM get_user_streak_info(test_user_id) INTO streak_after;

  IF streak_after = streak_before + 1 THEN
    RAISE NOTICE '✅ Test 5 PASSED: Learning session trigger works';
  ELSE
    RAISE NOTICE '❌ Test 5 FAILED: Expected streak %, got %', streak_before + 1, streak_after;
  END IF;

  -- Cleanup
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_sessions') THEN
    DELETE FROM learning_sessions WHERE id = session_id;
  ELSE
    DELETE FROM learning_sessions_partitioned WHERE id = session_id;
  END IF;
END $$;

-- Cleanup test data
DELETE FROM user_daily_activities WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID;
DELETE FROM user_streaks WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID;

-- Summary
RAISE NOTICE '';
RAISE NOTICE '🏁 Streak testing complete! Check messages above for results.';
RAISE NOTICE '📊 If all tests passed, the streak system is ready for production.';
RAISE NOTICE '⚠️  If any tests failed, review the implementation before deploying.';