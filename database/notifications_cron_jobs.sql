-- Notification System Cron Jobs
-- Automated scheduling for maintenance, reminders, and batch processing

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 1: Daily streak reminders (10 AM GMT)
-- This sends streak reminders to users who haven't been active
SELECT cron.schedule(
  'daily-streak-reminders',
  '0 10 * * *', -- 10:00 AM every day
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

-- Step 2: Process notification batches (every 5 minutes)
-- This handles digest notifications and batched delivery
SELECT cron.schedule(
  'process-notification-batches',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/process-notification-batches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Step 3: Hourly digest processing (top of every hour)
-- Alternative approach using direct database function
SELECT cron.schedule(
  'hourly-digest-processing',
  '0 * * * *', -- Top of every hour
  $$
  SELECT process_notification_batches();
  $$
);

-- Step 4: Daily system maintenance (2 AM GMT)
-- Cleanup old notifications, expired batches, and inactive tokens
SELECT cron.schedule(
  'daily-notification-maintenance',
  '0 2 * * *', -- 2:00 AM every day
  $$
  SELECT maintain_notification_system();
  $$
);

-- Step 5: Weekly analytics refresh (Sunday 3 AM GMT)
-- Refresh materialized views and generate weekly reports
SELECT cron.schedule(
  'weekly-analytics-refresh',
  '0 3 * * 0', -- 3:00 AM every Sunday
  $$
  DO $weekly$
  BEGIN
    -- Refresh analytics views (check if exists first)
    IF EXISTS (
      SELECT 1 FROM pg_matviews WHERE matviewname = 'notification_summary_stats'
    ) THEN
      REFRESH MATERIALIZED VIEW notification_summary_stats;
    END IF;

    -- Log weekly performance metrics
    INSERT INTO system_logs (log_type, message, data)
    SELECT
      'weekly_analytics',
      'Weekly notification performance',
      jsonb_build_object(
        'week_start', CURRENT_DATE - INTERVAL '7 days',
        'week_end', CURRENT_DATE,
        'total_notifications', COUNT(*),
        'unique_users', COUNT(DISTINCT user_id),
        'open_rate', ROUND(
          (COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::NUMERIC /
           NULLIF(COUNT(CASE WHEN push_sent = true THEN 1 END), 0)) * 100, 2
        )
      )
    FROM notifications
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
  END $weekly$;
  $$
);

-- Step 6: Health check monitoring (every 10 minutes)
-- Monitor system health and log alerts
SELECT cron.schedule(
  'notification-health-check',
  '*/10 * * * *', -- Every 10 minutes
  $$
  DO $health$
  DECLARE
    alert_record RECORD;
    alert_count INTEGER := 0;
  BEGIN
    -- Check for critical alerts
    FOR alert_record IN
      SELECT * FROM check_notification_health()
      WHERE alert_severity IN ('warning', 'critical')
    LOOP
      alert_count := alert_count + 1;

      -- Log the alert
      INSERT INTO system_logs (log_type, message, data, severity)
      VALUES (
        'notification_alert',
        alert_record.alert_message,
        jsonb_build_object(
          'alert_type', alert_record.alert_type,
          'affected_count', alert_record.affected_count
        ),
        alert_record.alert_severity
      );
    END LOOP;

    -- If there are critical alerts, you might want to trigger external monitoring
    IF alert_count > 0 THEN
      -- This could call an external webhook for critical alerts
      -- PERFORM net.http_post(...);
      NULL; -- Placeholder for external alert logic
    END IF;
  END $health$;
  $$
);

-- Step 7: Token cleanup (daily at 1 AM GMT)
-- Clean up invalid push tokens based on delivery failures
SELECT cron.schedule(
  'token-cleanup',
  '0 1 * * *', -- 1:00 AM every day
  $$
  DO $cleanup$
  DECLARE
    tokens_deactivated INTEGER;
  BEGIN
    -- Deactivate tokens that have failed consistently
    WITH failed_tokens AS (
      SELECT DISTINCT upt.id
      FROM user_push_tokens upt
      INNER JOIN notifications n ON n.user_id = upt.user_id
      WHERE n.created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND n.push_sent = false
        AND upt.is_active = true
      GROUP BY upt.id, upt.user_id
      HAVING COUNT(n.id) > 10 -- More than 10 failed notifications
    )
    UPDATE user_push_tokens
    SET
      is_active = false,
      updated_at = NOW()
    WHERE id IN (SELECT id FROM failed_tokens);

    GET DIAGNOSTICS tokens_deactivated = ROW_COUNT;

    -- Log cleanup results
    INSERT INTO system_logs (log_type, message, data)
    VALUES (
      'token_cleanup',
      'Daily token cleanup completed',
      jsonb_build_object(
        'tokens_deactivated', tokens_deactivated,
        'cleanup_date', CURRENT_DATE
      )
    );
  END $cleanup$;
  $$
);

-- Step 8: Performance optimization (weekly on Saturday 4 AM GMT)
-- Analyze and optimize notification system performance
SELECT cron.schedule(
  'weekly-performance-optimization',
  '0 4 * * 6', -- 4:00 AM every Saturday
  $$
  DO $optimize$
  BEGIN
    -- Analyze table statistics
    ANALYZE notifications;
    ANALYZE user_push_tokens;
    ANALYZE notification_batches;
    ANALYZE user_notification_preferences;

    -- Reindex if needed (based on fragmentation)
    REINDEX INDEX CONCURRENTLY idx_notifications_user_unread;
    REINDEX INDEX CONCURRENTLY idx_notifications_push_queue;

    -- Log optimization completion
    INSERT INTO system_logs (log_type, message, data)
    VALUES (
      'performance_optimization',
      'Weekly performance optimization completed',
      jsonb_build_object(
        'optimization_date', CURRENT_DATE,
        'tables_analyzed', 4,
        'indexes_rebuilt', 2
      )
    );
  END $optimize$;
  $$
);

-- Step 9: Monthly reporting (first day of month at 5 AM GMT)
-- Generate monthly performance reports
SELECT cron.schedule(
  'monthly-notification-report',
  '0 5 1 * *', -- 5:00 AM on the 1st of every month
  $$
  DO $report$
  DECLARE
    report_data JSONB;
  BEGIN
    -- Generate comprehensive monthly report
    SELECT jsonb_build_object(
      'period', CURRENT_DATE - INTERVAL '1 month' || ' to ' || CURRENT_DATE,
      'total_notifications', COUNT(*),
      'unique_recipients', COUNT(DISTINCT user_id),
      'delivery_rate', ROUND(
        (COUNT(CASE WHEN push_sent = true THEN 1 END)::NUMERIC /
         NULLIF(COUNT(*), 0)) * 100, 2
      ),
      'open_rate', ROUND(
        (COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::NUMERIC /
         NULLIF(COUNT(CASE WHEN push_sent = true THEN 1 END), 0)) * 100, 2
      ),
      'notification_types', jsonb_object_agg(
        type,
        COUNT(*)
      ),
      'top_engagement_users', (
        SELECT jsonb_agg(jsonb_build_object('user_id', user_id, 'open_rate', personal_open_rate))
        FROM (
          SELECT user_id, personal_open_rate
          FROM user_notification_engagement
          WHERE total_received >= 10
          ORDER BY personal_open_rate DESC
          LIMIT 10
        ) top_users
      )
    ) INTO report_data
    FROM notifications
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 month';

    -- Store the report
    INSERT INTO system_logs (log_type, message, data)
    VALUES (
      'monthly_report',
      'Monthly notification performance report',
      report_data
    );
  END $report$;
  $$
);

-- Step 10: Create system logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient log querying
CREATE INDEX IF NOT EXISTS idx_system_logs_type_date
ON system_logs (log_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_severity
ON system_logs (severity, created_at DESC);

-- Function to view cron job status
CREATE OR REPLACE FUNCTION get_cron_job_status()
RETURNS TABLE(
  job_name TEXT,
  schedule TEXT,
  active BOOLEAN,
  last_run TIMESTAMP WITH TIME ZONE,
  last_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.jobname::TEXT,
    j.schedule::TEXT,
    j.active,
    (
      SELECT MAX(r.start_time)
      FROM cron.job_run_details r
      WHERE r.jobid = j.jobid
    ) as last_run,
    (
      SELECT r.status
      FROM cron.job_run_details r
      WHERE r.jobid = j.jobid
      ORDER BY r.start_time DESC
      LIMIT 1
    )::TEXT as last_status
  FROM cron.job j
  WHERE j.jobname LIKE '%notification%'
     OR j.jobname LIKE '%streak%'
     OR j.jobname LIKE '%batch%'
  ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql;

-- Verification: Show all scheduled jobs
SELECT
  'NOTIFICATION CRON JOBS CONFIGURED' as status,
  'Automated tasks scheduled successfully' as message;

-- Display configured jobs
SELECT * FROM get_cron_job_status();

-- Note: Replace 'your-project.supabase.co' with your actual Supabase project URL
-- Set the service role key as a PostgreSQL setting:
-- SELECT set_config('app.supabase_service_role_key', 'your-service-role-key', false);