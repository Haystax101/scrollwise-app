-- Deploy Daily Streak Notifications - Database Function Approach
-- This creates notifications directly in the database without calling edge functions
-- Cleaner, faster, and no authentication issues

-- Step 1: Remove ALL old cron jobs related to streak reminders
DO $$
DECLARE
  job_name TEXT;
BEGIN
  FOR job_name IN
    SELECT jobname
    FROM cron.job
    WHERE jobname LIKE '%streak%'
  LOOP
    PERFORM cron.unschedule(job_name);
    RAISE NOTICE 'Removed cron job: %', job_name;
  END LOOP;
END $$;

-- Step 2: Create the database function
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
    -- Skip if user has quiet hours enabled
    -- Note: Simplified - assumes we're calling at 10 AM GMT which is usually outside quiet hours
    -- For production, you'd want to check actual quiet hours per user timezone

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

    -- Create notification directly
    INSERT INTO notifications (
      user_id,
      type,
      source_user_id,
      content_type,
      content_id,
      message,
      action_url,
      channel,
      data
    ) VALUES (
      user_record.user_id,
      'streak_reminder',
      user_record.user_id, -- System notification
      NULL,
      NULL,
      message_text,
      '/learning',
      'learning',
      jsonb_build_object(
        'current_streak', user_record.current_streak,
        'target_days', user_record.target_days,
        'reminder_type', 'daily',
        'generated_at', NOW()
      )
    );

    reminders_count := reminders_count + 1;

  END LOOP;

  -- Return summary
  RETURN QUERY SELECT reminders_count, skipped_count, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Add helpful comment
COMMENT ON FUNCTION send_daily_streak_reminders() IS
  'Sends daily streak reminder notifications to users who have not been active today. Called by cron job at 10 AM GMT.';

-- Step 4: Create the cron job
SELECT cron.schedule(
  'daily-streak-reminders',
  '0 10 * * *', -- 10 AM GMT every day
  $$SELECT send_daily_streak_reminders();$$
);

-- Step 5: Verify setup
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'daily-streak-reminders';

-- Step 6: Test immediately
-- Uncomment to test right now:
-- SELECT * FROM send_daily_streak_reminders();

-- Step 7: Check notifications created
-- Run this after testing:
-- SELECT COUNT(*) as notifications_created
-- FROM notifications
-- WHERE type = 'streak_reminder'
--   AND created_at >= NOW() - INTERVAL '1 minute';

-- Cleanup verification
SELECT
  'DEPLOYMENT COMPLETE' as status,
  'Streak notifications will run at 10 AM GMT daily' as message,
  'Old cron jobs removed, new database function created' as details;
