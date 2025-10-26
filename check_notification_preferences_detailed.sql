-- Check detailed notification preferences for eligible users

-- Part 1: Show full preferences for users who should get reminders
SELECT
  'DETAILED USER PREFERENCES' as section,
  p.full_name,
  p.email,
  us.current_streak,
  unp.streak_reminders as "streak_reminders (must be TRUE)",
  unp.learning_notifications as "learning_notifications (must be TRUE)",
  unp.system_notifications as "system_notifications",
  unp.digest_frequency,
  CASE
    WHEN unp.streak_reminders = false THEN '❌ BLOCKED: streak_reminders is FALSE'
    WHEN unp.learning_notifications = false THEN '❌ BLOCKED: learning_notifications is FALSE (channel disabled)'
    ELSE '✅ Should work'
  END as blocking_reason
FROM user_streaks us
INNER JOIN profiles p ON p.id = us.user_id
INNER JOIN user_notification_preferences unp ON unp.user_id = us.user_id
WHERE us.streak_type = 'daily_learning'
  AND us.is_active = true
  AND us.user_id NOT IN (
    SELECT DISTINCT user_id
    FROM user_daily_activities
    WHERE activity_date = CURRENT_DATE
  )
ORDER BY us.current_streak DESC
LIMIT 20;

-- Part 2: Count the specific blocking reasons
SELECT
  'BLOCKING REASONS SUMMARY' as section,
  COUNT(*) as total_eligible_users,
  COUNT(*) FILTER (WHERE unp.streak_reminders = false) as blocked_by_streak_reminders_disabled,
  COUNT(*) FILTER (WHERE unp.learning_notifications = false) as blocked_by_learning_channel_disabled,
  COUNT(*) FILTER (WHERE unp.streak_reminders = true AND unp.learning_notifications = true) as should_receive_notifications
FROM user_streaks us
INNER JOIN user_notification_preferences unp ON unp.user_id = us.user_id
WHERE us.streak_type = 'daily_learning'
  AND us.is_active = true
  AND us.user_id NOT IN (
    SELECT DISTINCT user_id
    FROM user_daily_activities
    WHERE activity_date = CURRENT_DATE
  );

-- Part 3: Check if there are any users who CAN receive notifications
SELECT
  'USERS WHO CAN RECEIVE' as section,
  COUNT(*) as count_of_users_who_should_receive
FROM user_streaks us
INNER JOIN user_notification_preferences unp ON unp.user_id = us.user_id
WHERE us.streak_type = 'daily_learning'
  AND us.is_active = true
  AND unp.streak_reminders = true
  AND unp.learning_notifications = true
  AND us.user_id NOT IN (
    SELECT DISTINCT user_id
    FROM user_daily_activities
    WHERE activity_date = CURRENT_DATE
  );

-- Part 4: Quick fix commands
SELECT
  'QUICK FIX' as section,
  'Enable learning_notifications for all users' as fix_1,
  'UPDATE user_notification_preferences SET learning_notifications = true;' as sql_1,
  'Enable streak_reminders for all users' as fix_2,
  'UPDATE user_notification_preferences SET streak_reminders = true;' as sql_2;
