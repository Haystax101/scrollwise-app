-- Notification Monitoring and Analytics
-- Enhanced analytics for tracking notification performance and user engagement

-- Step 1: Create analytics views for easy querying
CREATE OR REPLACE VIEW notification_analytics AS
SELECT
  DATE(created_at) as date,
  type,
  channel,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN push_sent = true THEN 1 END) as delivered_count,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened_count,
  ROUND(
    (COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::numeric /
     NULLIF(COUNT(CASE WHEN push_sent = true THEN 1 END), 0)) * 100, 2
  ) as open_rate_percent,
  AVG(EXTRACT(EPOCH FROM (opened_at - push_sent_at)) / 60) as avg_open_time_minutes
FROM notifications
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), type, channel
ORDER BY date DESC, type;

-- Step 2: Create daily metrics summary view
CREATE OR REPLACE VIEW daily_notification_metrics AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_notifications,
  COUNT(DISTINCT user_id) as unique_recipients,
  COUNT(CASE WHEN push_sent = true THEN 1 END) as delivery_success,
  COUNT(CASE WHEN push_sent = false AND created_at < NOW() - INTERVAL '1 hour' THEN 1 END) as delivery_failed,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as total_opens,
  COUNT(CASE WHEN type = 'like' THEN 1 END) as like_notifications,
  COUNT(CASE WHEN type = 'comment' THEN 1 END) as comment_notifications,
  COUNT(CASE WHEN type = 'friend_request' THEN 1 END) as friend_request_notifications,
  COUNT(CASE WHEN type = 'streak_reminder' THEN 1 END) as streak_reminders,
  ROUND(
    (COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::numeric /
     NULLIF(COUNT(CASE WHEN push_sent = true THEN 1 END), 0)) * 100, 2
  ) as overall_open_rate
FROM notifications
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Step 3: Create user engagement analytics view
CREATE OR REPLACE VIEW user_notification_engagement AS
SELECT
  user_id,
  COUNT(*) as total_received,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as total_opened,
  ROUND(
    (COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::numeric /
     NULLIF(COUNT(*), 0)) * 100, 2
  ) as personal_open_rate,
  MAX(opened_at) as last_engagement,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_notifications,
  COUNT(CASE WHEN opened_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_opens
FROM notifications
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id
HAVING COUNT(*) > 0
ORDER BY personal_open_rate DESC;

-- Step 4: Create notification performance monitoring function
CREATE OR REPLACE FUNCTION get_notification_performance(
  days_back INTEGER DEFAULT 7
) RETURNS TABLE(
  metric_name TEXT,
  metric_value NUMERIC,
  period_start DATE,
  period_end DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Total Notifications'::TEXT,
    COUNT(*)::NUMERIC,
    CURRENT_DATE - days_back::INTEGER,
    CURRENT_DATE
  FROM notifications
  WHERE created_at >= CURRENT_DATE - days_back

  UNION ALL

  SELECT
    'Delivery Rate %'::TEXT,
    ROUND(
      (COUNT(CASE WHEN push_sent = true THEN 1 END)::NUMERIC /
       NULLIF(COUNT(*), 0)) * 100, 2
    ),
    CURRENT_DATE - days_back::INTEGER,
    CURRENT_DATE
  FROM notifications
  WHERE created_at >= CURRENT_DATE - days_back

  UNION ALL

  SELECT
    'Open Rate %'::TEXT,
    ROUND(
      (COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::NUMERIC /
       NULLIF(COUNT(CASE WHEN push_sent = true THEN 1 END), 0)) * 100, 2
    ),
    CURRENT_DATE - days_back::INTEGER,
    CURRENT_DATE
  FROM notifications
  WHERE created_at >= CURRENT_DATE - days_back

  UNION ALL

  SELECT
    'Avg Open Time (minutes)'::TEXT,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (opened_at - push_sent_at)) / 60)::NUMERIC, 2
    ),
    CURRENT_DATE - days_back::INTEGER,
    CURRENT_DATE
  FROM notifications
  WHERE created_at >= CURRENT_DATE - days_back
    AND opened_at IS NOT NULL
    AND push_sent_at IS NOT NULL

  UNION ALL

  SELECT
    'Unique Recipients'::TEXT,
    COUNT(DISTINCT user_id)::NUMERIC,
    CURRENT_DATE - days_back::INTEGER,
    CURRENT_DATE
  FROM notifications
  WHERE created_at >= CURRENT_DATE - days_back;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create real-time monitoring function for alerts
CREATE OR REPLACE FUNCTION check_notification_health()
RETURNS TABLE(
  alert_type TEXT,
  alert_message TEXT,
  alert_severity TEXT, -- 'info', 'warning', 'critical'
  affected_count INTEGER
) AS $$
DECLARE
  delivery_rate NUMERIC;
  recent_failures INTEGER;
  stale_notifications INTEGER;
  high_failure_users INTEGER;
BEGIN
  -- Check delivery rate in last hour
  SELECT
    COALESCE(
      ROUND(
        (COUNT(CASE WHEN push_sent = true THEN 1 END)::NUMERIC /
         NULLIF(COUNT(*), 0)) * 100, 2
      ), 0
    ) INTO delivery_rate
  FROM notifications
  WHERE created_at >= NOW() - INTERVAL '1 hour';

  -- Check for recent delivery failures
  SELECT COUNT(*) INTO recent_failures
  FROM notifications
  WHERE created_at >= NOW() - INTERVAL '10 minutes'
    AND push_sent = false;

  -- Check for stale notifications (not sent after 30 minutes)
  SELECT COUNT(*) INTO stale_notifications
  FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 minutes'
    AND push_sent = false;

  -- Check for users with high failure rates
  SELECT COUNT(*) INTO high_failure_users
  FROM (
    SELECT user_id
    FROM notifications
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY user_id
    HAVING COUNT(*) > 5
      AND (COUNT(CASE WHEN push_sent = false THEN 1 END)::NUMERIC / COUNT(*)) > 0.5
  ) subq;

  -- Return alerts
  IF delivery_rate < 90 AND delivery_rate > 0 THEN
    RETURN QUERY SELECT
      'Low Delivery Rate'::TEXT,
      'Delivery rate in last hour: ' || delivery_rate || '%'::TEXT,
      CASE
        WHEN delivery_rate < 70 THEN 'critical'
        WHEN delivery_rate < 85 THEN 'warning'
        ELSE 'info'
      END::TEXT,
      0;
  END IF;

  IF recent_failures > 10 THEN
    RETURN QUERY SELECT
      'High Recent Failures'::TEXT,
      recent_failures || ' notifications failed in last 10 minutes'::TEXT,
      CASE
        WHEN recent_failures > 50 THEN 'critical'
        WHEN recent_failures > 25 THEN 'warning'
        ELSE 'info'
      END::TEXT,
      recent_failures;
  END IF;

  IF stale_notifications > 0 THEN
    RETURN QUERY SELECT
      'Stale Notifications'::TEXT,
      stale_notifications || ' notifications pending for >30 minutes'::TEXT,
      CASE
        WHEN stale_notifications > 100 THEN 'critical'
        WHEN stale_notifications > 20 THEN 'warning'
        ELSE 'info'
      END::TEXT,
      stale_notifications;
  END IF;

  IF high_failure_users > 0 THEN
    RETURN QUERY SELECT
      'Users with High Failures'::TEXT,
      high_failure_users || ' users experiencing >50% delivery failures'::TEXT,
      'warning'::TEXT,
      high_failure_users;
  END IF;

  -- If no alerts, return healthy status
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      'System Health'::TEXT,
      'All notification systems operating normally'::TEXT,
      'info'::TEXT,
      0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create batch analytics function
CREATE OR REPLACE FUNCTION analyze_notification_batches(
  days_back INTEGER DEFAULT 7
) RETURNS TABLE(
  batch_type TEXT,
  total_batches INTEGER,
  avg_batch_size NUMERIC,
  total_notifications INTEGER,
  batch_efficiency_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nb.notification_type::TEXT,
    COUNT(nb.id)::INTEGER as total_batches,
    ROUND(AVG(nb.count), 2) as avg_batch_size,
    SUM(nb.count)::INTEGER as total_notifications,
    ROUND(
      (COUNT(nb.id)::NUMERIC / NULLIF(SUM(nb.count), 0)) * 100, 2
    ) as batch_efficiency_percent
  FROM notification_batches nb
  WHERE nb.created_at >= CURRENT_DATE - days_back
  GROUP BY nb.notification_type
  ORDER BY total_notifications DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create cleanup and maintenance function
CREATE OR REPLACE FUNCTION maintain_notification_system()
RETURNS TABLE(
  task_name TEXT,
  records_affected INTEGER,
  execution_time_ms INTEGER
) AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  affected_count INTEGER;
BEGIN
  -- Task 1: Clean up old notifications (90+ days)
  start_time := clock_timestamp();

  DELETE FROM notifications
  WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  end_time := clock_timestamp();

  RETURN QUERY SELECT
    'Clean Old Notifications'::TEXT,
    affected_count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;

  -- Task 2: Clean up expired batches
  start_time := clock_timestamp();

  DELETE FROM notification_batches
  WHERE expires_at < NOW() - INTERVAL '1 day';

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  end_time := clock_timestamp();

  RETURN QUERY SELECT
    'Clean Expired Batches'::TEXT,
    affected_count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;

  -- Task 3: Deactivate old push tokens
  start_time := clock_timestamp();

  UPDATE user_push_tokens
  SET is_active = false
  WHERE updated_at < NOW() - INTERVAL '6 months'
    AND is_active = true;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  end_time := clock_timestamp();

  RETURN QUERY SELECT
    'Deactivate Old Tokens'::TEXT,
    affected_count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;

  -- Task 4: Update notification statistics
  start_time := clock_timestamp();

  -- Check if materialized view exists before refreshing
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'notification_summary_stats'
  ) THEN
    REFRESH MATERIALIZED VIEW notification_summary_stats;
  END IF;

  end_time := clock_timestamp();

  RETURN QUERY SELECT
    'Refresh Statistics'::TEXT,
    0,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_notifications_analytics_date
ON notifications (DATE(created_at), type, channel);

CREATE INDEX IF NOT EXISTS idx_notifications_performance
ON notifications (created_at, push_sent, opened_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_engagement
ON notifications (user_id, created_at, opened_at);

-- Step 9: Grant necessary permissions for monitoring
-- Note: Adjust these based on your RLS and user requirements

-- Verification queries
SELECT
  'NOTIFICATION MONITORING DEPLOYED' as status,
  'Analytics and monitoring system ready' as message;

-- Show available monitoring functions
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name LIKE '%notification%'
  AND routine_schema = 'public'
ORDER BY routine_name;