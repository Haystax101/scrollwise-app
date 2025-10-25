-- Test the Edge Function Directly
-- This will manually trigger the edge function and show us if it works

-- Step 1: Manually trigger the edge function right now
SELECT net.http_post(
  url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/daily-streak-reminders',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
  ),
  body := '{}'::jsonb
) AS edge_function_response;

-- Wait 10-15 seconds after running the above, then run this:

-- Step 2: Check if notifications were created in the last minute
SELECT
  id,
  user_id,
  type,
  message,
  created_at
FROM notifications
WHERE type = 'streak_reminder'
  AND created_at >= NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;

-- Step 3: Check the exact query the edge function uses to find users
-- This simulates what the edge function should be doing
SELECT
  us.user_id,
  us.current_streak,
  us.target_days,
  p.full_name,
  unp.timezone,
  unp.streak_reminders
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
LIMIT 5;

-- Step 4: Check if create_notification_secure function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'create_notification_secure'
) AS function_exists;

-- Step 5: If function exists, test creating a notification manually
-- Replace 'YOUR_USER_ID' with an actual user_id from Step 3
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
