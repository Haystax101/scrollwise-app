-- Diagnostic Script for Daily Streak Notifications
-- Run this in Supabase SQL Editor to diagnose the issue

-- Step 1: Check if pg_cron extension is enabled
SELECT EXISTS (
  SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
) AS pg_cron_enabled;

-- Step 2: Check if the cron job exists
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'daily-streak-reminders';

-- Step 3: Check recent cron job executions
SELECT
  r.runid,
  r.job_pid,
  r.start_time,
  r.end_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
INNER JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname = 'daily-streak-reminders'
ORDER BY r.start_time DESC
LIMIT 10;

-- Step 4: Check if service role key is configured
SELECT current_setting('app.supabase_service_role_key', true) IS NOT NULL AS service_key_configured;

-- Step 5: Check if pg_net extension is enabled
SELECT EXISTS (
  SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
) AS pg_net_enabled;

-- Step 6: Check users who should receive streak reminders
SELECT COUNT(*) AS users_needing_reminders
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
  );

-- Step 7: Check if there are any active push tokens
SELECT COUNT(*) AS active_push_tokens
FROM user_push_tokens
WHERE is_active = true;

-- Step 8: Check recent notifications created
SELECT
  type,
  COUNT(*) as count,
  MAX(created_at) as most_recent
FROM notifications
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY type
ORDER BY count DESC;

-- Step 9: Check if create_notification_secure function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'create_notification_secure'
) AS create_notification_function_exists;

-- Step 10: Test notification creation manually (replace with your user_id)
-- Uncomment and replace user_id to test
/*
SELECT create_notification_secure(
  'YOUR_USER_ID'::UUID,
  'YOUR_USER_ID'::UUID,
  'streak_reminder',
  NULL,
  NULL,
  'Test streak reminder - Keep your learning streak alive! 🔥',
  '/learning',
  '{"test": true}'::JSONB,
  'learning'
);
*/

-- Summary Report
SELECT
  'DIAGNOSTIC SUMMARY' as report_section,
  jsonb_pretty(jsonb_build_object(
    'cron_configured', (SELECT COUNT(*) FROM cron.job WHERE jobname = 'daily-streak-reminders'),
    'recent_executions', (SELECT COUNT(*) FROM cron.job_run_details r INNER JOIN cron.job j ON j.jobid = r.jobid WHERE j.jobname = 'daily-streak-reminders' AND r.start_time >= CURRENT_DATE - 1),
    'users_eligible', (
      SELECT COUNT(*)
      FROM user_streaks us
      INNER JOIN user_notification_preferences unp ON unp.user_id = us.user_id
      WHERE us.streak_type = 'daily_learning'
        AND us.is_active = true
        AND unp.streak_reminders = true
    ),
    'active_tokens', (SELECT COUNT(*) FROM user_push_tokens WHERE is_active = true),
    'streak_notifications_sent_today', (
      SELECT COUNT(*)
      FROM notifications
      WHERE type = 'streak_reminder'
        AND created_at >= CURRENT_DATE
    )
  )) as diagnostic_data;
