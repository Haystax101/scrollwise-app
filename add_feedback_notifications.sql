-- Add Feedback Board Notifications
-- Notify all users when new feedback is posted to boost engagement

-- Step 1: Add 'feedback_posted' to allowed notification types
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type = ANY (ARRAY[
  'like'::text,
  'comment'::text,
  'friend_request'::text,
  'friend_accepted'::text,
  'save'::text,
  'share'::text,
  'streak_reminder'::text,
  'goal_achievement'::text,
  'friend_insight'::text,
  'milestone'::text,
  'reply'::text,
  'digest'::text,
  'level_up'::text,
  'feedback_posted'::text  -- NEW
]));

-- Step 2: Add feedback_board preference to user_notification_preferences
ALTER TABLE user_notification_preferences
ADD COLUMN IF NOT EXISTS feedback_board boolean DEFAULT true;

COMMENT ON COLUMN user_notification_preferences.feedback_board IS
  'Receive notifications when new feedback is posted on the feedback board';

-- Step 3: Update create_notification_secure to handle feedback_posted
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
    WHEN 'friend_activity', 'friend_insight' THEN
      IF user_prefs.friend_activity = FALSE THEN RETURN NULL; END IF;
      should_batch := true;
    WHEN 'streak_reminder' THEN
      IF user_prefs.streak_reminders = FALSE THEN RETURN NULL; END IF;
    WHEN 'goal_achievement' THEN
      IF user_prefs.goal_achievements = FALSE THEN RETURN NULL; END IF;
    WHEN 'feedback_posted' THEN
      IF user_prefs.feedback_board = FALSE THEN RETURN NULL; END IF;
      should_batch := true;
  END CASE;

  -- Determine notification channel
  channel_name := COALESCE(channel_override,
    CASE
      WHEN notification_type IN ('friend_request', 'friend_accepted', 'friend_activity', 'friend_insight', 'like', 'comment', 'save') THEN 'social'
      WHEN notification_type IN ('streak_reminder', 'goal_achievement') THEN 'learning'
      WHEN notification_type IN ('feedback_posted') THEN 'system'
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
      WHEN 'friend_activity', 'friend_insight' THEN default_message := default_message || ' posted a new insight';
      WHEN 'save' THEN default_message := default_message || ' saved your ' || COALESCE(content_type, 'content');
      WHEN 'streak_reminder' THEN default_message := 'Keep your learning streak going!';
      WHEN 'goal_achievement' THEN default_message := 'Congratulations on reaching your goal!';
      WHEN 'feedback_posted' THEN default_message := default_message || ' posted new feedback';
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

  -- Queue for push notification (only if immediate or no batching)
  IF NOT should_batch OR user_prefs.digest_frequency = 'immediate' THEN
    PERFORM pg_notify('push_notification', json_build_object(
      'notification_id', notification_id,
      'user_id', recipient_id,
      'type', notification_type,
      'message', default_message,
      'channel', channel_name,
      'batch_id', batch_id
    )::text);
  END IF;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_notification_secure IS
  'Creates notifications with security, rate limiting, batching, and push delivery via pg_notify. Updated to support feedback_posted notifications.';

-- Step 4: Update rate limiter to handle feedback_posted
DROP FUNCTION IF EXISTS check_notification_rate_limit(UUID, TEXT);

CREATE OR REPLACE FUNCTION check_notification_rate_limit(
  user_id_param UUID,
  notification_type_param TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  recent_count INTEGER;
  rate_limit INTEGER;
BEGIN
  -- Set rate limits per notification type (per hour)
  CASE notification_type_param
    WHEN 'like', 'save' THEN rate_limit := 20;
    WHEN 'comment', 'reply' THEN rate_limit := 10;
    WHEN 'friend_request' THEN rate_limit := 5;
    WHEN 'streak_reminder' THEN rate_limit := 1;
    WHEN 'feedback_posted' THEN rate_limit := 10;  -- Max 10 feedback notifications per hour
    ELSE rate_limit := 15;
  END CASE;

  -- Count recent notifications of this type
  SELECT COUNT(*) INTO recent_count
  FROM notifications
  WHERE user_id = user_id_param
    AND type = notification_type_param
    AND created_at > NOW() - INTERVAL '1 hour';

  RETURN recent_count < rate_limit;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger function to notify all users when feedback is posted
DROP FUNCTION IF EXISTS notify_users_of_new_feedback() CASCADE;

CREATE FUNCTION notify_users_of_new_feedback()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  notification_count INTEGER := 0;
  feedback_title TEXT;
BEGIN
  -- Only send notifications for newly created feedback (not updates)
  IF TG_OP = 'INSERT' THEN
    -- Sanitize and truncate feedback title for notification
    feedback_title := LEFT(NEW.title, 50);
    IF LENGTH(NEW.title) > 50 THEN
      feedback_title := feedback_title || '...';
    END IF;

    -- Send notification to all users except the author
    FOR user_record IN
      SELECT id
      FROM profiles
      WHERE id != NEW.user_id  -- Don't notify the author
    LOOP
      BEGIN
        -- Create notification for each user
        PERFORM create_notification_secure(
          recipient_id := user_record.id,
          source_user_id := NEW.user_id,
          notification_type := 'feedback_posted',
          content_type := NULL,
          content_id := NEW.id::text,
          custom_message := NULL,  -- Will use default message with author's name
          action_url := '/feedback',
          additional_data := jsonb_build_object(
            'feedback_id', NEW.id,
            'feedback_title', feedback_title,
            'created_at', NEW.created_at
          ),
          channel_override := 'system'
        );

        notification_count := notification_count + 1;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the insert
          RAISE WARNING 'Failed to notify user % about feedback %: %',
            user_record.id, NEW.id, SQLERRM;
      END;
    END LOOP;

    RAISE NOTICE 'Created % feedback notifications for feedback "%"',
      notification_count, NEW.title;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_users_of_new_feedback() IS
  'Sends notifications to all users when new feedback is posted on the feedback board';

-- Step 6: Create trigger on feedback table
DROP TRIGGER IF EXISTS trigger_notify_new_feedback ON feedback;

CREATE TRIGGER trigger_notify_new_feedback
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_of_new_feedback();

COMMENT ON TRIGGER trigger_notify_new_feedback ON feedback IS
  'Triggers notifications to all users when new feedback is posted';

-- Step 7: Verification queries
SELECT
  'FEEDBACK NOTIFICATIONS DEPLOYED' as status,
  'Users will be notified when new feedback is posted' as description;

-- Check constraint was updated
SELECT
  'NOTIFICATION TYPE CHECK' as check_name,
  CASE
    WHEN conbin::text LIKE '%feedback_posted%' THEN '✅ feedback_posted added to allowed types'
    ELSE '❌ feedback_posted NOT in constraint'
  END as status
FROM pg_constraint
WHERE conname = 'notifications_type_check'
  AND conrelid = 'notifications'::regclass;

-- Check new preference column exists
SELECT
  'PREFERENCE COLUMN' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_notification_preferences'
        AND column_name = 'feedback_board'
    ) THEN '✅ feedback_board preference column exists'
    ELSE '❌ feedback_board column NOT created'
  END as status;

-- Check trigger exists
SELECT
  'TRIGGER CHECK' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trigger_notify_new_feedback'
    ) THEN '✅ Trigger created successfully'
    ELSE '❌ Trigger NOT found'
  END as status;

-- Show how many users have feedback notifications enabled
SELECT
  'USER PREFERENCES' as check_name,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE feedback_board = true) as enabled,
  COUNT(*) FILTER (WHERE feedback_board = false) as disabled
FROM user_notification_preferences;
