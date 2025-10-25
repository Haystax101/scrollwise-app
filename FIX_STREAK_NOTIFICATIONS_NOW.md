# Fix Daily Streak Notifications - Step by Step Guide

## Current Status

✅ Edge function `daily-streak-reminders` is deployed (version 4, updated Oct 10)
❌ Notifications are not being sent daily

## Most Likely Issues

1. **Cron job is not configured** in Supabase
2. **Service role key is not set** as a database setting
3. **Cron job exists but is failing** silently

## Solution - 3 Steps

### Step 1: Run Diagnostic Script

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- File: diagnose_streak_notifications.sql
```

Copy and paste the entire contents of `diagnose_streak_notifications.sql` and run it.

**Look for:**

- `cron_configured`: Should be 1 (if 0, cron job doesn't exist)
- `recent_executions`: Should show recent runs (if 0, job isn't running)
- `users_eligible`: Number of users who should get reminders
- `active_tokens`: Should have push tokens registered

---

### Step 2: Fix the Cron Job

Go to Supabase Dashboard → SQL Editor and run these commands **one by one**:

#### A. Enable extensions

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

#### B. Set your service role key

**IMPORTANT**: Get your service role key from:
Supabase Dashboard → Project Settings → API → `service_role` (secret key)

```sql
-- Replace YOUR_SERVICE_ROLE_KEY with your actual key
ALTER DATABASE postgres SET app.supabase_service_role_key TO 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_ACTUAL_KEY';
```

#### C. Remove old cron job if it exists

```sql
SELECT cron.unschedule('daily-streak-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-streak-reminders'
);
```

#### D. Create the cron job

```sql
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
```

#### E. Verify the cron job was created

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname = 'daily-streak-reminders';
```

You should see:

- `jobname`: daily-streak-reminders
- `schedule`: 0 10 \* \* \*
- `active`: true

---

### Step 3: Test Immediately

#### Manual Test (triggers the edge function now)

```sql
SELECT net.http_post(
  url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/daily-streak-reminders',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
  ),
  body := '{}'::jsonb
);
```

Wait 10-15 seconds, then check if notifications were created:

```sql
SELECT
  COUNT(*) as notifications_created,
  MAX(created_at) as most_recent
FROM notifications
WHERE type = 'streak_reminder'
  AND created_at >= NOW() - INTERVAL '5 minutes';
```

If `notifications_created > 0`, it's working! 🎉

---

## Alternative: Database Function Approach (if pg_net doesn't work)

If the above doesn't work, use this simpler database-only approach:

### Create the function

```sql
CREATE OR REPLACE FUNCTION send_daily_streak_reminders()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  message_text TEXT;
BEGIN
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
    IF user_record.current_streak <= 3 THEN
      message_text := 'You''re building momentum! Keep your learning streak alive today 🔥';
    ELSIF user_record.current_streak <= 14 THEN
      message_text := user_record.current_streak || ' days strong! Don''t break the chain now 💪';
    ELSE
      message_text := 'Amazing ' || user_record.current_streak || '-day streak! You''re unstoppable 🏆';
    END IF;

    INSERT INTO notifications (
      user_id,
      type,
      source_user_id,
      message,
      action_url,
      channel
    ) VALUES (
      user_record.user_id,
      'streak_reminder',
      user_record.user_id,
      message_text,
      '/learning',
      'learning'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Schedule it

```sql
SELECT cron.schedule(
  'daily-streak-reminders-db',
  '0 10 * * *',
  $$SELECT send_daily_streak_reminders();$$
);
```

### Test it now

```sql
SELECT send_daily_streak_reminders();
```

Check notifications:

```sql
SELECT * FROM notifications WHERE type = 'streak_reminder' ORDER BY created_at DESC LIMIT 5;
```

---

## Verification Checklist

After running the fix:

- [ ] Cron job exists and is active
- [ ] Manual test creates notifications
- [ ] Notifications appear in the app
- [ ] Push notifications are sent (check your phone)

## Monitoring

To check if cron is running daily:

```sql
SELECT
  r.start_time,
  r.end_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
INNER JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname LIKE '%streak%'
ORDER BY r.start_time DESC
LIMIT 10;
```

## Troubleshooting

### Issue: "function current_setting does not exist"

**Solution**: The service role key wasn't set. Go back to Step 2B.

### Issue: "extension pg_net does not exist"

**Solution**: Run `CREATE EXTENSION pg_net;` in SQL Editor

### Issue: "notifications created but no push sent"

**Solution**: Check the `process-notification-batches` edge function is running every 5 minutes

### Issue: Still not working

**Solution**: Use the Alternative Database Function Approach above

---

## Next Steps

Once working:

1. Monitor for 24 hours to ensure it runs at 10 AM GMT
2. Check user feedback on notification timing
3. Adjust cron schedule if needed (e.g., `'0 9 * * *'` for 9 AM)

## Files Reference

- `diagnose_streak_notifications.sql` - Diagnostic queries
- `fix_daily_streak_notifications.sql` - Complete fix script
- `supabase/functions/daily-streak-reminders/index.ts` - Edge function code

[
{
"report_section": "DIAGNOSTIC SUMMARY",
"diagnostic_data": "{\n \"active_tokens\": 3,\n \"users_eligible\": 29,\n \"cron_configured\": 1,\n \"recent_executions\": 1,\n \"streak_notifications_sent_today\": 0\n}"
}
]
