-- Fix Daily Streak Notifications
-- This script ensures the daily streak notification system works properly

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Remove old cron job if it exists
SELECT cron.unschedule('daily-streak-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-streak-reminders'
);

-- Step 3: Set the service role key (REPLACE WITH YOUR ACTUAL KEY)
-- You can find this in Supabase Dashboard → Project Settings → API → service_role key
-- Run this separately or uncomment and replace:
-- ALTER DATABASE postgres SET app.supabase_service_role_key TO 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

-- Step 4: Create the cron job with hardcoded URL
-- IMPORTANT: Replace 'hefmtydvnbouibdulyjs' with your actual Supabase project ID
SELECT cron.schedule(
  'daily-streak-reminders',
  '0 10 * * *', -- 10 AM GMT every day
  $$
  SELECT net.http_post(
    url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/daily-streak-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Step 5: Verify the cron job was created
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'daily-streak-reminders';

-- Step 6: Test the notification system manually
-- This will trigger the edge function immediately for testing
SELECT net.http_post(
  url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/daily-streak-reminders',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
  ),
  body := '{}'::jsonb
);

-- Step 7: Check if the test created any notifications
-- Run this a few seconds after the test
SELECT
  COUNT(*) as notifications_created,
  MAX(created_at) as most_recent
FROM notifications
WHERE type = 'streak_reminder'
  AND created_at >= NOW() - INTERVAL '5 minutes';

-- Alternative: If pg_net doesn't work, use a database trigger approach
-- This creates notifications directly without calling the edge function

CREATE OR REPLACE FUNCTION send_daily_streak_reminders()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  message_text TEXT;
BEGIN
  -- Find users who need reminders
  FOR user_record IN
    SELECT
      us.user_id,
      us.current_streak,
      us.target_days,
      p.full_name
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
    -- Generate personalized message
    IF user_record.current_streak <= 3 THEN
      message_text := 'You''re building momentum! Keep your learning streak alive today 🔥';
    ELSIF user_record.current_streak <= 14 THEN
      message_text := user_record.current_streak || ' days strong! Don''t break the chain now 💪';
    ELSE
      message_text := 'Amazing ' || user_record.current_streak || '-day streak! You''re unstoppable 🏆';
    END IF;

    -- Create notification
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
      user_record.user_id,
      NULL,
      NULL,
      message_text,
      '/learning',
      'learning',
      jsonb_build_object(
        'current_streak', user_record.current_streak,
        'target_days', user_record.target_days
      )
    );
  END LOOP;

  RAISE NOTICE 'Daily streak reminders sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative cron job using database function instead of edge function
SELECT cron.unschedule('daily-streak-reminders-db')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-streak-reminders-db'
);

SELECT cron.schedule(
  'daily-streak-reminders-db',
  '0 10 * * *', -- 10 AM GMT every day
  $$
  SELECT send_daily_streak_reminders();
  $$
);

-- Manual test of the database function
-- Uncomment to test immediately:
-- SELECT send_daily_streak_reminders();

-- Verification
SELECT
  'SETUP COMPLETE' as status,
  'Two options configured:' as message,
  '1. Edge function via pg_net (daily-streak-reminders)' as option_1,
  '2. Database function (daily-streak-reminders-db)' as option_2,
  'Both will run at 10 AM GMT daily' as schedule;
