-- Immediate Push Notification Delivery via HTTP
-- Replaces pg_notify() with direct HTTP calls to edge function

-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update create_notification_secure to use HTTP instead of pg_notify
-- We only need to replace the notification delivery part (lines 183-193)

DROP FUNCTION IF EXISTS create_notification_secure(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT);

CREATE FUNCTION create_notification_secure(
  recipient_id UUID,
  source_user_id UUID,
  notification_type TEXT,
  content_type TEXT DEFAULT NULL,
  content_id TEXT DEFAULT NULL,
  custom_message TEXT DEFAULT NULL,
  action_url TEXT DEFAULT NULL,
  additional_data JSONB DEFAULT '{}',
  channel_override TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  batch_id UUID;
  batch_key TEXT;
  default_message TEXT;
  user_prefs RECORD;
  should_batch BOOLEAN := false;
  existing_batch RECORD;
  channel_name TEXT;
BEGIN
  -- Input validation and sanitization
  IF recipient_id IS NULL OR source_user_id IS NULL OR notification_type IS NULL THEN
    RAISE WARNING 'create_notification_secure: Missing required parameters';
    RETURN NULL;
  END IF;

  -- Prevent self-notifications
  IF recipient_id = source_user_id AND notification_type NOT IN ('streak_reminder', 'goal_achievement') THEN
    RETURN NULL;
  END IF;

  -- Rate limiting check
  IF NOT check_notification_rate_limit(recipient_id, notification_type) THEN
    RAISE WARNING 'Rate limit exceeded for user % notification type %', recipient_id, notification_type;
    RETURN NULL;
  END IF;

  -- Get user notification preferences
  SELECT * INTO user_prefs
  FROM user_notification_preferences
  WHERE user_id = recipient_id;

  -- If no preferences exist, create defaults
  IF user_prefs IS NULL THEN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (recipient_id);

    SELECT * INTO user_prefs
    FROM user_notification_preferences
    WHERE user_id = recipient_id;
  END IF;

  -- Check if user wants this type of notification
  CASE notification_type
    WHEN 'like', 'save' THEN
      IF user_prefs.likes = FALSE THEN RETURN NULL; END IF;
      should_batch := true;
    WHEN 'comment', 'reply' THEN
      IF user_prefs.comments = FALSE THEN RETURN NULL; END IF;
      should_batch := (user_prefs.digest_frequency = 'batched_5min');
    WHEN 'friend_request' THEN
      IF user_prefs.friend_requests = FALSE THEN RETURN NULL; END IF;
    WHEN 'friend_accepted' THEN
      IF user_prefs.friend_requests = FALSE THEN RETURN NULL; END IF;
    WHEN 'friend_activity' THEN
      IF user_prefs.friend_activity = FALSE THEN RETURN NULL; END IF;
      should_batch := true;
    WHEN 'streak_reminder' THEN
      IF user_prefs.streak_reminders = FALSE THEN RETURN NULL; END IF;
    WHEN 'goal_achievement' THEN
      IF user_prefs.goal_achievements = FALSE THEN RETURN NULL; END IF;
  END CASE;

  -- Determine notification channel
  channel_name := COALESCE(channel_override,
    CASE
      WHEN notification_type IN ('friend_request', 'friend_accepted', 'like', 'comment', 'save') THEN 'social'
      WHEN notification_type IN ('streak_reminder', 'goal_achievement') THEN 'learning'
      ELSE 'system'
    END
  );

  -- Check channel preferences
  CASE channel_name
    WHEN 'social' THEN
      IF user_prefs.social_notifications = FALSE THEN RETURN NULL; END IF;
    WHEN 'learning' THEN
      IF user_prefs.learning_notifications = FALSE THEN RETURN NULL; END IF;
    WHEN 'system' THEN
      IF user_prefs.system_notifications = FALSE THEN RETURN NULL; END IF;
  END CASE;

  -- Handle batching for appropriate notification types
  IF should_batch AND user_prefs.digest_frequency IN ('batched_5min', 'hourly') THEN
    -- Create batch key for grouping similar notifications
    batch_key := notification_type || ':' || COALESCE(content_type, '') || ':' || COALESCE(content_id, '');

    -- Check for existing active batch
    SELECT * INTO existing_batch
    FROM notification_batches
    WHERE user_id = recipient_id
      AND batch_key = batch_key
      AND expires_at > NOW();

    IF existing_batch IS NOT NULL THEN
      -- Update existing batch
      UPDATE notification_batches
      SET
        count = count + 1,
        expires_at = NOW() + INTERVAL '5 minutes'
      WHERE id = existing_batch.id;

      batch_id := existing_batch.id;
    ELSE
      -- Create new batch
      INSERT INTO notification_batches (
        user_id, notification_type, content_type, content_id, batch_key
      ) VALUES (
        recipient_id, notification_type, content_type, content_id, batch_key
      ) RETURNING id INTO batch_id;
    END IF;
  END IF;

  -- Sanitize message content to prevent XSS/injection
  IF custom_message IS NOT NULL THEN
    -- Basic sanitization - remove potential script tags and SQL
    custom_message := regexp_replace(custom_message, '<[^>]*>', '', 'g');
    custom_message := regexp_replace(custom_message, '[;''"]', '', 'g');
    default_message := LEFT(custom_message, 200); -- Limit message length
  ELSE
    -- Generate safe default message
    SELECT full_name INTO default_message FROM profiles WHERE id = source_user_id;
    default_message := COALESCE(default_message, 'Someone');

    CASE notification_type
      WHEN 'like' THEN default_message := default_message || ' liked your ' || COALESCE(content_type, 'content');
      WHEN 'comment' THEN default_message := default_message || ' commented on your ' || COALESCE(content_type, 'content');
      WHEN 'friend_request' THEN default_message := default_message || ' sent you a friend request';
      WHEN 'friend_accepted' THEN default_message := default_message || ' accepted your friend request';
      WHEN 'save' THEN default_message := default_message || ' saved your ' || COALESCE(content_type, 'content');
      WHEN 'streak_reminder' THEN default_message := 'Keep your learning streak going!';
      WHEN 'goal_achievement' THEN default_message := 'Congratulations on reaching your goal!';
      ELSE default_message := 'New notification';
    END CASE;
  END IF;

  -- Sanitize action URL
  IF action_url IS NOT NULL THEN
    -- Only allow relative URLs or app scheme URLs for security
    IF action_url !~ '^(/|supercharged://)' THEN
      action_url := NULL;
    END IF;
  END IF;

  -- Sanitize additional data to prevent PII exposure
  additional_data := jsonb_strip_nulls(additional_data);
  -- Remove potentially sensitive fields
  additional_data := additional_data - 'email' - 'phone' - 'address' - 'password';

  -- Insert notification
  INSERT INTO notifications (
    user_id, source_user_id, type, content_type, content_id,
    message, action_url, data, batch_id, channel
  ) VALUES (
    recipient_id, source_user_id, notification_type, content_type, content_id,
    default_message, action_url, additional_data, batch_id, channel_name
  ) RETURNING id INTO notification_id;

  -- Update batch with latest notification
  IF batch_id IS NOT NULL THEN
    UPDATE notification_batches
    SET last_notification_id = notification_id
    WHERE id = batch_id;
  END IF;

  -- *** CHANGED: Send push notification via HTTP instead of pg_notify ***
  -- Queue for push notification via HTTP (only if immediate or no batching)
  IF NOT should_batch OR user_prefs.digest_frequency = 'immediate' THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        ),
        body := jsonb_build_object(
          'notification_id', notification_id,
          'user_id', recipient_id,
          'type', notification_type,
          'message', default_message,
          'channel', channel_name,
          'batch_id', batch_id
        )
      );

      RAISE NOTICE 'Push notification HTTP request sent for notification %', notification_id;
    EXCEPTION
      WHEN OTHERS THEN
        -- Don't fail the transaction if HTTP request fails
        RAISE WARNING 'Failed to send push notification HTTP request: %', SQLERRM;
    END;
  END IF;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update process_notification_batches to use HTTP instead of pg_notify
DROP FUNCTION IF EXISTS process_notification_batches();

CREATE FUNCTION process_notification_batches()
RETURNS INTEGER AS $$
DECLARE
  batch_record RECORD;
  processed_count INTEGER := 0;
  batch_message TEXT;
BEGIN
  -- Process expired batches
  FOR batch_record IN
    SELECT * FROM notification_batches
    WHERE expires_at <= NOW()
      AND last_notification_id IS NOT NULL
  LOOP
    -- Create batched message
    IF batch_record.count = 1 THEN
      -- Single notification, send as-is
      BEGIN
        PERFORM net.http_post(
          url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/send-push-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
          ),
          body := jsonb_build_object(
            'notification_id', batch_record.last_notification_id,
            'user_id', batch_record.user_id,
            'type', batch_record.notification_type,
            'batch_id', batch_record.id
          )
        );
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to send batched notification: %', SQLERRM;
      END;
    ELSE
      -- Multiple notifications, create summary
      CASE batch_record.notification_type
        WHEN 'like' THEN
          batch_message := batch_record.count || ' people liked your ' || COALESCE(batch_record.content_type, 'content');
        WHEN 'save' THEN
          batch_message := batch_record.count || ' people saved your ' || COALESCE(batch_record.content_type, 'content');
        WHEN 'friend_activity' THEN
          batch_message := batch_record.count || ' new insights from your friends';
        ELSE
          batch_message := batch_record.count || ' new ' || batch_record.notification_type || ' notifications';
      END CASE;

      -- Send batched notification via HTTP
      BEGIN
        PERFORM net.http_post(
          url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/send-push-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
          ),
          body := jsonb_build_object(
            'notification_id', batch_record.last_notification_id,
            'user_id', batch_record.user_id,
            'type', 'digest',
            'message', batch_message,
            'batch_id', batch_record.id,
            'count', batch_record.count
          )
        );
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to send batched notification: %', SQLERRM;
      END;
    END IF;

    processed_count := processed_count + 1;
  END LOOP;

  -- Clean up processed batches
  DELETE FROM notification_batches
  WHERE expires_at <= NOW();

  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
SELECT
  'IMMEDIATE NOTIFICATION DELIVERY DEPLOYED' as status,
  'pg_notify replaced with HTTP calls to edge function' as message;

-- Important: Make sure to set the service role key if not already set:
-- SELECT set_config('app.supabase_service_role_key', 'your-service-role-key-here', false);
