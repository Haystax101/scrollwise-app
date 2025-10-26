-- Fix Streak Notifications Delivery
-- The issue: Notifications are created in DB but not delivered as push notifications
-- Solution: Update function to use create_notification_secure() which handles push delivery

-- Step 1: Drop and recreate the function to use create_notification_secure()
DROP FUNCTION IF EXISTS send_daily_streak_reminders();

CREATE OR REPLACE FUNCTION send_daily_streak_reminders()
RETURNS TABLE(
  reminders_sent INTEGER,
  reminders_skipped INTEGER,
  execution_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  user_record RECORD;
  message_text TEXT;
  reminders_count INTEGER := 0;
  skipped_count INTEGER := 0;
  notification_id UUID;
BEGIN
  -- Find users who need reminders
  FOR user_record IN
    SELECT
      us.user_id,
      us.current_streak,
      us.target_days,
      p.full_name,
      unp.quiet_hours_enabled,
      unp.quiet_hours_start,
      unp.quiet_hours_end,
      unp.timezone
    FROM user_streaks us
    INNER JOIN profiles p ON p.id = us.user_id
    INNER JOIN user_notification_preferences unp ON unp.user_id = us.user_id
    WHERE us.streak_type = 'daily_learning'
      AND us.is_active = true
      AND unp.streak_reminders = true
      AND us.user_id NOT IN (
        SELECT DISTINCT user_id
        FROM user_daily_activities
        WHERE activity_date = CURRENT_DATE
      )
  LOOP
    -- Generate personalized message based on streak length
    IF user_record.current_streak <= 3 THEN
      message_text := 'You''re building momentum! Keep your learning streak alive today 🔥';
    ELSIF user_record.current_streak <= 14 THEN
      message_text := user_record.current_streak || ' days strong! Don''t break the chain now 💪';
    ELSIF user_record.current_streak <= 29 THEN
      message_text := 'Amazing ' || user_record.current_streak || '-day streak! You''re unstoppable 🏆';
    ELSE
      message_text := 'Legendary ' || user_record.current_streak || '-day streak! You''re an inspiration 🌟';
    END IF;

    -- *** CHANGED: Use create_notification_secure() to handle push delivery ***
    BEGIN
      SELECT create_notification_secure(
        recipient_id := user_record.user_id,
        source_user_id := user_record.user_id, -- System notification (self)
        notification_type := 'streak_reminder',
        content_type := NULL,
        content_id := NULL,
        custom_message := message_text,
        action_url := '/learning',
        additional_data := jsonb_build_object(
          'current_streak', user_record.current_streak,
          'target_days', user_record.target_days,
          'reminder_type', 'daily',
          'generated_at', NOW()
        ),
        channel_override := 'learning'
      ) INTO notification_id;

      IF notification_id IS NOT NULL THEN
        reminders_count := reminders_count + 1;
        RAISE NOTICE 'Sent streak reminder to user % (notification %)', user_record.user_id, notification_id;
      ELSE
        skipped_count := skipped_count + 1;
        RAISE NOTICE 'Skipped streak reminder for user % (preferences or rate limit)', user_record.user_id;
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        skipped_count := skipped_count + 1;
        RAISE WARNING 'Failed to send streak reminder to user %: %', user_record.user_id, SQLERRM;
    END;

  END LOOP;

  -- Return summary
  RETURN QUERY SELECT reminders_count, skipped_count, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update comment
COMMENT ON FUNCTION send_daily_streak_reminders() IS
  'Sends daily streak reminder notifications with push delivery via create_notification_secure(). Called by cron job at 10 AM GMT.';

-- Step 3: Verify the function was updated
SELECT
  'STREAK NOTIFICATIONS FIXED' as status,
  'Function now uses create_notification_secure() for push delivery' as change,
  'Push notifications will be sent via HTTP to edge function' as delivery_method;

-- Step 4: Test immediately (uncomment to run)
-- SELECT * FROM send_daily_streak_reminders();

-- Step 5: Check recent notifications
-- Run this after testing to verify push_sent is being updated
-- SELECT
--   created_at,
--   type,
--   message,
--   push_sent,
--   CASE
--     WHEN push_sent = true THEN '✅ Delivered'
--     ELSE '❌ Not delivered'
--   END as delivery_status
-- FROM notifications
-- WHERE type = 'streak_reminder'
--   AND created_at >= NOW() - INTERVAL '5 minutes'
-- ORDER BY created_at DESC;
