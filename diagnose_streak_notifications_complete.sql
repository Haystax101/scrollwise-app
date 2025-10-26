-- Complete Diagnostic for Daily Streak Notifications
-- Run this to identify why notifications aren't being sent

-- ===========================================================================
-- PART 1: CHECK CRON JOB CONFIGURATION
-- ===========================================================================

-- 1.1: Check all cron jobs
SELECT
  'CRON JOBS' as section,
  jobid,
  jobname,
  schedule,
  active,
  command,
  nodename,
  nodeport
FROM cron.job
ORDER BY jobname;

-- 1.2: Check for streak-related cron jobs specifically
SELECT
  'STREAK CRON JOBS' as section,
  jobid,
  jobname,
  schedule,
  active,
  CASE
    WHEN active THEN '✅ Active'
    ELSE '❌ Inactive'
  END as status,
  command
FROM cron.job
WHERE jobname LIKE '%streak%' OR command LIKE '%streak%';

-- ===========================================================================
-- PART 2: CHECK RECENT CRON JOB EXECUTIONS
-- ===========================================================================

-- 2.1: Check recent executions for ALL cron jobs
SELECT
  'RECENT EXECUTIONS (All Jobs)' as section,
  j.jobname,
  r.runid,
  r.start_time,
  r.end_time,
  r.status,
  r.return_message,
  EXTRACT(EPOCH FROM (r.end_time - r.start_time)) as duration_seconds
FROM cron.job_run_details r
INNER JOIN cron.job j ON j.jobid = r.jobid
WHERE r.start_time >= NOW() - INTERVAL '7 days'
ORDER BY r.start_time DESC
LIMIT 50;

-- 2.2: Check executions for streak notification job specifically
SELECT
  'STREAK JOB EXECUTIONS' as section,
  j.jobname,
  r.start_time,
  r.end_time,
  r.status,
  r.return_message,
  CASE
    WHEN r.status = 'succeeded' THEN '✅ Success'
    WHEN r.status = 'failed' THEN '❌ Failed'
    ELSE '⚠️ ' || r.status
  END as execution_status
FROM cron.job_run_details r
INNER JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname LIKE '%streak%'
  AND r.start_time >= NOW() - INTERVAL '7 days'
ORDER BY r.start_time DESC;

-- ===========================================================================
-- PART 3: CHECK FUNCTION EXISTS AND WORKS
-- ===========================================================================

-- 3.1: Check if the function exists
SELECT
  'FUNCTION CHECK' as section,
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'send_daily_streak_reminders';

-- 3.2: Test the function manually (UNCOMMENT TO RUN TEST)
-- SELECT
--   'MANUAL TEST EXECUTION' as section,
--   reminders_sent,
--   reminders_skipped,
--   execution_time
-- FROM send_daily_streak_reminders();

-- ===========================================================================
-- PART 4: CHECK ELIGIBLE USERS FOR REMINDERS
-- ===========================================================================

-- 4.1: Count users who should receive reminders
SELECT
  'ELIGIBLE USERS TODAY' as section,
  COUNT(*) as total_eligible_users
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

-- 4.2: Show sample users who should receive reminders
SELECT
  'SAMPLE ELIGIBLE USERS' as section,
  us.user_id,
  p.full_name,
  us.current_streak,
  us.target_days,
  unp.streak_reminders as has_reminders_enabled,
  unp.timezone,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_daily_activities uda
      WHERE uda.user_id = us.user_id AND uda.activity_date = CURRENT_DATE
    ) THEN '✅ Active today'
    ELSE '❌ Not active today'
  END as activity_status
FROM user_streaks us
INNER JOIN profiles p ON p.id = us.user_id
INNER JOIN user_notification_preferences unp ON unp.user_id = us.user_id
WHERE us.streak_type = 'daily_learning'
  AND us.is_active = true
LIMIT 10;

-- ===========================================================================
-- PART 5: CHECK NOTIFICATION PREFERENCES
-- ===========================================================================

-- 5.1: Check how many users have streak reminders enabled
SELECT
  'NOTIFICATION PREFERENCES' as section,
  COUNT(*) FILTER (WHERE streak_reminders = true) as users_with_reminders_enabled,
  COUNT(*) FILTER (WHERE streak_reminders = false) as users_with_reminders_disabled,
  COUNT(*) as total_users
FROM user_notification_preferences;

-- 5.2: Check if table exists and has data
SELECT
  'TABLE CHECK' as section,
  'user_notification_preferences' as table_name,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE streak_reminders = true) as enabled_count
FROM user_notification_preferences;

-- ===========================================================================
-- PART 6: CHECK RECENT NOTIFICATIONS CREATED
-- ===========================================================================

-- 6.1: Count streak reminder notifications created in last 7 days
SELECT
  'NOTIFICATIONS CREATED (7 days)' as section,
  COUNT(*) as total_streak_notifications,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - 1) as yesterday,
  MIN(created_at) as oldest_notification,
  MAX(created_at) as newest_notification
FROM notifications
WHERE type = 'streak_reminder';

-- 6.2: Show recent streak reminder notifications
SELECT
  'RECENT STREAK NOTIFICATIONS' as section,
  n.created_at,
  p.full_name as recipient,
  n.message,
  n.is_read,
  n.data
FROM notifications n
INNER JOIN profiles p ON p.id = n.user_id
WHERE n.type = 'streak_reminder'
ORDER BY n.created_at DESC
LIMIT 20;

-- ===========================================================================
-- PART 7: CHECK USER STREAKS TABLE
-- ===========================================================================

-- 7.1: Check active streaks
SELECT
  'ACTIVE STREAKS' as section,
  COUNT(*) as total_active_streaks,
  AVG(current_streak) as avg_streak_length,
  MAX(current_streak) as max_streak
FROM user_streaks
WHERE streak_type = 'daily_learning'
  AND is_active = true;

-- 7.2: Sample active streaks
SELECT
  'SAMPLE ACTIVE STREAKS' as section,
  p.full_name,
  us.current_streak,
  us.target_days,
  us.last_activity_date,
  CASE
    WHEN us.last_activity_date = CURRENT_DATE THEN '✅ Active today'
    WHEN us.last_activity_date = CURRENT_DATE - 1 THEN '⚠️ Last active yesterday'
    ELSE '❌ Inactive for ' || (CURRENT_DATE - us.last_activity_date) || ' days'
  END as status
FROM user_streaks us
INNER JOIN profiles p ON p.id = us.user_id
WHERE us.streak_type = 'daily_learning'
  AND us.is_active = true
ORDER BY us.current_streak DESC
LIMIT 10;

-- ===========================================================================
-- PART 8: SUMMARY & RECOMMENDATIONS
-- ===========================================================================

SELECT
  'DIAGNOSIS SUMMARY' as section,
  CASE
    WHEN (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE '%streak%') = 0
    THEN '❌ ISSUE: No streak cron job found'
    WHEN (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE '%streak%' AND active = false) > 0
    THEN '❌ ISSUE: Cron job exists but is INACTIVE'
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_daily_streak_reminders')
    THEN '❌ ISSUE: Function send_daily_streak_reminders does not exist'
    WHEN (SELECT COUNT(*) FROM user_notification_preferences WHERE streak_reminders = true) = 0
    THEN '⚠️ WARNING: No users have streak reminders enabled'
    ELSE '✅ Configuration looks good'
  END as diagnosis,
  CASE
    WHEN (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE '%streak%') = 0
    THEN 'Run deploy_streak_notifications_db_function.sql'
    WHEN (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE '%streak%' AND active = false) > 0
    THEN 'Activate the cron job: UPDATE cron.job SET active = true WHERE jobname LIKE ''%streak%'''
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_daily_streak_reminders')
    THEN 'Run deploy_streak_notifications_db_function.sql to create function'
    WHEN (SELECT COUNT(*) FROM user_notification_preferences WHERE streak_reminders = true) = 0
    THEN 'Enable streak reminders for test users in user_notification_preferences'
    ELSE 'Check cron execution logs above for errors'
  END as recommended_action;

-- ===========================================================================
-- QUICK FIX COMMANDS (uncomment to use)
-- ===========================================================================

-- To manually test the notification function right now:
-- SELECT * FROM send_daily_streak_reminders();

-- To activate an inactive cron job:
-- UPDATE cron.job SET active = true WHERE jobname LIKE '%streak%';

-- To enable streak reminders for a test user:
-- UPDATE user_notification_preferences
-- SET streak_reminders = true
-- WHERE user_id = 'YOUR_USER_ID_HERE';

-- To manually create a test notification:
-- INSERT INTO notifications (user_id, type, source_user_id, message, action_url, channel)
-- VALUES (
--   'YOUR_USER_ID_HERE',
--   'streak_reminder',
--   'YOUR_USER_ID_HERE',
--   'Test streak reminder - Keep your learning streak alive! 🔥',
--   '/learning',
--   'learning'
-- );