-- Debug Why Streak Notifications Are Being Skipped
-- Check each potential reason why create_notification_secure() returns NULL

-- ===========================================================================
-- PART 1: CHECK USER NOTIFICATION PREFERENCES
-- ===========================================================================

-- 1.1: Check if streak_reminders is enabled for users
SELECT
  'USER PREFERENCES CHECK' as section,
  COUNT(*) FILTER (WHERE unp.streak_reminders = true) as users_with_streak_reminders_enabled,
  COUNT(*) FILTER (WHERE unp.streak_reminders = false) as users_with_streak_reminders_disabled,
  COUNT(*) FILTER (WHERE unp.learning_notifications = true) as users_with_learning_channel_enabled,
  COUNT(*) FILTER (WHERE unp.learning_notifications = false) as users_with_learning_channel_disabled,
  COUNT(*) as total_users_checked
FROM user_streaks us
INNER JOIN user_notification_preferences unp ON unp.user_id = us.user_id
WHERE us.streak_type = 'daily_learning'
  AND us.is_active = true
  AND us.user_id NOT IN (
    SELECT DISTINCT user_id
    FROM user_daily_activities
    WHERE activity_date = CURRENT_DATE
  );

-- 1.2: Show sample user preferences
SELECT
  'SAMPLE USER PREFERENCES' as section,
  p.full_name,
  us.current_streak,
  unp.streak_reminders as streak_reminders_enabled,
  unp.learning_notifications as learning_channel_enabled,
  unp.digest_frequency,
  unp.quiet_hours_enabled,
  CASE
    WHEN unp.streak_reminders = false THEN '❌ Streak reminders disabled'
    WHEN unp.learning_notifications = false THEN '❌ Learning channel disabled'
    ELSE '✅ Should receive notifications'
  END as status
FROM user_streaks us
INNER JOIN profiles p ON p.id = us.user_id
INNER JOIN user_notification_preferences unp ON unp.user_id = us.user_id
WHERE us.streak_type = 'daily_learning'
  AND us.is_active = true
LIMIT 10;

-- ===========================================================================
-- PART 2: CHECK IF create_notification_secure FUNCTION EXISTS
-- ===========================================================================

SELECT
  'FUNCTION CHECK' as section,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_notification_secure')
    THEN '✅ Function exists'
    ELSE '❌ Function does not exist'
  END as function_exists;

-- ===========================================================================
-- PART 3: MANUALLY TEST create_notification_secure FOR ONE USER
-- ===========================================================================

-- Get a sample user who should receive notification
DO $$
DECLARE
  test_user_id UUID;
  test_notification_id UUID;
BEGIN
  -- Get first eligible user
  SELECT us.user_id INTO test_user_id
  FROM user_streaks us
  INNER JOIN user_notification_preferences unp ON unp.user_id = us.user_id
  WHERE us.streak_type = 'daily_learning'
    AND us.is_active = true
    AND unp.streak_reminders = true
    AND us.user_id NOT IN (
      SELECT DISTINCT user_id
      FROM user_daily_activities
      WHERE activity_date = CURRENT_DATE
    )
  LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE '🧪 Testing notification for user: %', test_user_id;

    -- Try to create notification
    SELECT create_notification_secure(
      recipient_id := test_user_id,
      source_user_id := test_user_id,
      notification_type := 'streak_reminder',
      content_type := NULL,
      content_id := NULL,
      custom_message := 'Test streak reminder',
      action_url := '/learning',
      additional_data := jsonb_build_object('test', true),
      channel_override := 'learning'
    ) INTO test_notification_id;

    IF test_notification_id IS NOT NULL THEN
      RAISE NOTICE '✅ Notification created successfully: %', test_notification_id;
    ELSE
      RAISE NOTICE '❌ Notification was NOT created (function returned NULL)';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ No eligible users found for testing';
  END IF;
END $$;

-- ===========================================================================
-- PART 4: CHECK RATE LIMITING
-- ===========================================================================

-- Check if there's a rate limiting issue
SELECT
  'RATE LIMIT CHECK' as section,
  COUNT(*) as recent_streak_notifications_sent
FROM notifications
WHERE type = 'streak_reminder'
  AND created_at >= CURRENT_DATE;

-- ===========================================================================
-- PART 5: CHECK IF LEARNING CHANNEL IS DISABLED GLOBALLY
-- ===========================================================================

-- Check how many users have learning_notifications enabled
SELECT
  'LEARNING CHANNEL STATUS' as section,
  COUNT(*) FILTER (WHERE learning_notifications = true) as enabled_count,
  COUNT(*) FILTER (WHERE learning_notifications = false) as disabled_count,
  COUNT(*) as total_users,
  ROUND(100.0 * COUNT(*) FILTER (WHERE learning_notifications = true) / COUNT(*), 1) as enabled_percentage
FROM user_notification_preferences;

-- ===========================================================================
-- PART 6: CHECK DEFAULT PREFERENCES FOR NEW USERS
-- ===========================================================================

-- Check what the default values are for new user preferences
SELECT
  'DEFAULT PREFERENCES' as section,
  column_name,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_notification_preferences'
  AND column_name IN ('streak_reminders', 'learning_notifications', 'digest_frequency')
ORDER BY ordinal_position;

-- ===========================================================================
-- PART 7: DIAGNOSIS
-- ===========================================================================

SELECT
  'DIAGNOSIS' as section,
  CASE
    WHEN (SELECT COUNT(*) FROM user_notification_preferences WHERE streak_reminders = true) = 0
    THEN '❌ ISSUE: No users have streak_reminders = true'
    WHEN (SELECT COUNT(*) FROM user_notification_preferences WHERE learning_notifications = true) = 0
    THEN '❌ ISSUE: No users have learning_notifications = true'
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_notification_secure')
    THEN '❌ ISSUE: create_notification_secure function does not exist'
    ELSE '⚠️ Check logs above for other issues (rate limiting, preferences, etc.)'
  END as diagnosis,
  CASE
    WHEN (SELECT COUNT(*) FROM user_notification_preferences WHERE streak_reminders = true) = 0
    THEN 'UPDATE user_notification_preferences SET streak_reminders = true;'
    WHEN (SELECT COUNT(*) FROM user_notification_preferences WHERE learning_notifications = true) = 0
    THEN 'UPDATE user_notification_preferences SET learning_notifications = true;'
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_notification_secure')
    THEN 'Run notifications_immediate_delivery_v2.sql to create the function'
    ELSE 'Check individual user preferences and rate limits'
  END as suggested_fix;
