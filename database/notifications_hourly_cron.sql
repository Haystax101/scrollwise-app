-- Hourly Streak Reminders Cron Job
-- Runs every hour and sends to users where it's currently 7-9 AM local time
-- This replaces the previous once-daily approach for better timezone coverage

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- First, remove the old daily cron job if it exists
SELECT cron.unschedule('daily-streak-reminders');

-- Schedule hourly streak reminders
-- Runs at minute 0 of every hour
SELECT cron.schedule(
  'hourly-streak-reminders',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/daily-streak-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Function-Secret', private.get_function_secret()
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule retry job for failed notifications (every 15 minutes)
SELECT cron.schedule(
  'retry-failed-notifications',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT retry_failed_notifications();
  $$
);

-- Keep the batch processing (every 5 minutes for digest notifications)
-- This should already exist, but update if needed
DO $$
BEGIN
  -- Check if job exists before trying to unschedule
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-notification-batches') THEN
    PERFORM cron.unschedule('process-notification-batches');
  END IF;
END $$;

SELECT cron.schedule(
  'process-notification-batches',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/process-notification-batches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Function-Secret', private.get_function_secret()
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verification: Show all scheduled notification jobs
SELECT
  'HOURLY STREAK REMINDERS CONFIGURED' as status,
  'Cron jobs updated for timezone-aware delivery' as message;

-- Display configured jobs
SELECT * FROM get_cron_job_status();

-- Important notes:
-- 1. The streak reminders now run hourly and check each user's timezone
-- 2. Users receive notifications when it's 7-9 AM in their local time
-- 3. Failed notifications are automatically retried every 15 minutes
-- 4. Batch/digest notifications are still processed every 5 minutes

-- =====================================================
-- PREREQUISITE: Set up the function secret
-- =====================================================
-- This cron job uses private.get_function_secret() which reads from Vault.
-- Make sure you've already run notifications_trigger_on_insert.sql which creates
-- this function, and then stored your secret in Vault:
--
-- SELECT vault.create_secret(
--   'your-random-secret-here',
--   'edge_function_secret',
--   'Secret for authenticating database to edge function calls'
-- );
--
-- Also set the same secret in Edge Function Secrets (Dashboard):
--   Name: FUNCTION_SECRET
--   Value: your-random-secret-here
-- =====================================================
