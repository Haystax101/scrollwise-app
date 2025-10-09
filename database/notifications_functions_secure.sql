-- Secure Notification Functions
-- Enhanced with 2025 security best practices and performance optimizations

-- Step 1: Enhanced notification creation function with batching and security
CREATE OR REPLACE FUNCTION create_notification_secure(
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

-- Step 2: Secure trigger functions with improved performance
CREATE OR REPLACE FUNCTION notify_on_like_secure()
RETURNS TRIGGER AS $$
DECLARE
  content_owner_id UUID;
  content_type_name TEXT;
  content_title TEXT;
BEGIN
  -- Determine content owner and type with single query optimization
  CASE TG_TABLE_NAME
    WHEN 'insight_likes' THEN
      SELECT author_id, 'insight', LEFT(content, 50)
      INTO content_owner_id, content_type_name, content_title
      FROM insights WHERE id = NEW.insight_id;
    WHEN 'article_likes' THEN
      -- Articles don't have individual owners, skip notification
      RETURN NEW;
    WHEN 'paper_likes' THEN
      -- Papers don't have individual owners, skip notification
      RETURN NEW;
    WHEN 'book_likes' THEN
      -- Books don't have individual owners, skip notification
      RETURN NEW;
  END CASE;

  -- Only notify if content has an owner (user-generated content)
  IF content_owner_id IS NOT NULL THEN
    PERFORM create_notification_secure(
      content_owner_id,
      NEW.user_id,
      'like',
      content_type_name,
      COALESCE(NEW.insight_id, NEW.article_id, NEW.paper_id, NEW.book_id)::TEXT,
      NULL, -- Use default message
      '/content/' || content_type_name || '/' || COALESCE(NEW.insight_id, NEW.article_id, NEW.paper_id, NEW.book_id),
      jsonb_build_object('content_preview', content_title)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure triggers
DROP TRIGGER IF EXISTS insight_like_notification ON insight_likes;
CREATE TRIGGER insight_like_notification_secure
  AFTER INSERT ON insight_likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like_secure();

-- Step 3: Secure comment notification function
CREATE OR REPLACE FUNCTION notify_on_comment_secure()
RETURNS TRIGGER AS $$
DECLARE
  content_owner_id UUID;
  content_type_name TEXT;
  parent_comment_owner_id UUID;
BEGIN
  -- Handle content owner notifications
  CASE TG_TABLE_NAME
    WHEN 'insight_comments' THEN
      SELECT author_id INTO content_owner_id FROM insights WHERE id = NEW.insight_id;
      content_type_name := 'insight';
    WHEN 'comments' THEN
      -- Articles don't have owners in this system
      content_owner_id := NULL;
      content_type_name := 'article';
  END CASE;

  -- Notify content owner (if not the commenter)
  IF content_owner_id IS NOT NULL AND content_owner_id != NEW.user_id THEN
    PERFORM create_notification_secure(
      content_owner_id,
      NEW.user_id,
      'comment',
      content_type_name,
      COALESCE(NEW.insight_id, NEW.article_id)::TEXT,
      NULL,
      '/content/' || content_type_name || '/' || COALESCE(NEW.insight_id, NEW.article_id) || '#comment-' || NEW.id
    );
  END IF;

  -- Handle reply notifications (if this is a reply to another comment)
  IF NEW.parent_comment_id IS NOT NULL THEN
    CASE TG_TABLE_NAME
      WHEN 'insight_comments' THEN
        SELECT user_id INTO parent_comment_owner_id
        FROM insight_comments WHERE id = NEW.parent_comment_id;
      WHEN 'comments' THEN
        SELECT user_id INTO parent_comment_owner_id
        FROM comments WHERE id = NEW.parent_comment_id;
    END CASE;

    -- Notify parent comment owner (if different from current commenter and content owner)
    IF parent_comment_owner_id IS NOT NULL
       AND parent_comment_owner_id != NEW.user_id
       AND parent_comment_owner_id != content_owner_id THEN
      PERFORM create_notification_secure(
        parent_comment_owner_id,
        NEW.user_id,
        'reply',
        content_type_name,
        COALESCE(NEW.insight_id, NEW.article_id)::TEXT,
        NULL,
        '/content/' || content_type_name || '/' || COALESCE(NEW.insight_id, NEW.article_id) || '#comment-' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure comment triggers
DROP TRIGGER IF EXISTS insight_comment_notification ON insight_comments;
CREATE TRIGGER insight_comment_notification_secure
  AFTER INSERT ON insight_comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment_secure();

-- Step 4: Secure friend request notifications
CREATE OR REPLACE FUNCTION notify_on_friend_request_secure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status IS NULL) THEN
    -- New friend request (high priority - can override quiet hours)
    PERFORM create_notification_secure(
      NEW.addressee_id,
      NEW.requester_id,
      'friend_request',
      NULL,
      NEW.id::TEXT,
      NULL,
      '/profile/' || NEW.requester_id,
      jsonb_build_object('high_priority', true)
    );
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Friend request accepted - notify the requester
    PERFORM create_notification_secure(
      NEW.requester_id,
      NEW.addressee_id,
      'friend_accepted',
      NULL,
      NEW.id::TEXT,
      NULL,
      '/profile/' || NEW.addressee_id,
      jsonb_build_object('high_priority', false)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure friendship trigger
DROP TRIGGER IF EXISTS friendship_notification ON friendships;
CREATE TRIGGER friendship_notification_secure
  AFTER INSERT OR UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_on_friend_request_secure();

-- Step 5: Batch processing function for digest notifications
CREATE OR REPLACE FUNCTION process_notification_batches()
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
      PERFORM pg_notify('push_notification', json_build_object(
        'notification_id', batch_record.last_notification_id,
        'user_id', batch_record.user_id,
        'type', batch_record.notification_type,
        'batch_id', batch_record.id
      )::text);
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

      -- Send batched notification
      PERFORM pg_notify('push_notification', json_build_object(
        'notification_id', batch_record.last_notification_id,
        'user_id', batch_record.user_id,
        'type', 'digest',
        'message', batch_message,
        'batch_id', batch_record.id,
        'count', batch_record.count
      )::text);
    END IF;

    processed_count := processed_count + 1;
  END LOOP;

  -- Clean up processed batches
  DELETE FROM notification_batches
  WHERE expires_at <= NOW();

  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Analytics function for notification tracking
CREATE OR REPLACE FUNCTION track_notification_event(
  notification_id_param UUID,
  event_type TEXT, -- 'delivered', 'opened', 'failed'
  additional_info JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
BEGIN
  CASE event_type
    WHEN 'delivered' THEN
      UPDATE notifications
      SET
        push_sent = true,
        push_sent_at = NOW(),
        data = data || jsonb_build_object('delivery_info', additional_info)
      WHERE id = notification_id_param;

    WHEN 'opened' THEN
      UPDATE notifications
      SET
        opened_at = NOW(),
        is_read = true,
        data = data || jsonb_build_object('open_info', additional_info)
      WHERE id = notification_id_param;

    WHEN 'failed' THEN
      UPDATE notifications
      SET data = data || jsonb_build_object('failure_info', additional_info)
      WHERE id = notification_id_param;
  END CASE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
SELECT
  'SECURE NOTIFICATION FUNCTIONS DEPLOYED' as status,
  'Enhanced with 2025 security and performance features' as message;