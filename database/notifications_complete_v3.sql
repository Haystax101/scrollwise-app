-- Complete Notification System v3
-- Includes HTTP-based push delivery + ALL triggers
-- This is the COMPLETE, PRODUCTION-READY notification system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- PART 1: Core Notification Function with HTTP Push Delivery
-- ============================================================================

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
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZm10eWR2bmJvdWliZHVseWpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2NDc3MSwiZXhwIjoyMDY1MTQwNzcxfQ.ORZqf5Kg0-bRJljlUnRpdgJu8MVQU9Pkj8VjhzagDu4';
BEGIN
  -- Input validation
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
  END CASE;

  -- Determine notification channel
  channel_name := COALESCE(channel_override,
    CASE
      WHEN notification_type IN ('friend_request', 'friend_accepted', 'friend_activity', 'friend_insight', 'like', 'comment', 'save') THEN 'social'
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

  -- Handle batching
  IF should_batch AND user_prefs.digest_frequency IN ('batched_5min', 'hourly') THEN
    batch_key := notification_type || ':' || COALESCE(content_type, '') || ':' || COALESCE(content_id, '');

    SELECT * INTO existing_batch
    FROM notification_batches
    WHERE user_id = recipient_id
      AND batch_key = batch_key
      AND expires_at > NOW();

    IF existing_batch IS NOT NULL THEN
      UPDATE notification_batches
      SET count = count + 1, expires_at = NOW() + INTERVAL '5 minutes'
      WHERE id = existing_batch.id;
      batch_id := existing_batch.id;
    ELSE
      INSERT INTO notification_batches (user_id, notification_type, content_type, content_id, batch_key)
      VALUES (recipient_id, notification_type, content_type, content_id, batch_key)
      RETURNING id INTO batch_id;
    END IF;
  END IF;

  -- Sanitize message
  IF custom_message IS NOT NULL THEN
    custom_message := regexp_replace(custom_message, '<[^>]*>', '', 'g');
    custom_message := regexp_replace(custom_message, '[;''"]', '', 'g');
    default_message := LEFT(custom_message, 200);
  ELSE
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
      ELSE default_message := 'New notification';
    END CASE;
  END IF;

  -- Sanitize action URL
  IF action_url IS NOT NULL THEN
    IF action_url !~ '^(/|supercharged://)' THEN
      action_url := NULL;
    END IF;
  END IF;

  -- Sanitize additional data
  additional_data := jsonb_strip_nulls(additional_data);
  additional_data := additional_data - 'email' - 'phone' - 'address' - 'password';

  -- Insert notification
  INSERT INTO notifications (
    user_id, source_user_id, type, content_type, content_id,
    message, action_url, data, batch_id, channel
  ) VALUES (
    recipient_id, source_user_id, notification_type, content_type, content_id,
    default_message, action_url, additional_data, batch_id, channel_name
  ) RETURNING id INTO notification_id;

  -- Update batch
  IF batch_id IS NOT NULL THEN
    UPDATE notification_batches SET last_notification_id = notification_id WHERE id = batch_id;
  END IF;

  -- Send push notification via HTTP
  IF NOT should_batch OR user_prefs.digest_frequency = 'immediate' THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
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
      RAISE NOTICE 'Push notification sent for notification %', notification_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to send push notification: %', SQLERRM;
    END;
  END IF;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: Friend Request/Accepted Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS friendship_notification_secure ON friendships;
DROP FUNCTION IF EXISTS notify_on_friend_request_secure();

CREATE FUNCTION notify_on_friend_request_secure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status IS NULL) THEN
    -- New friend request
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
    -- Friend request accepted
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

CREATE TRIGGER friendship_notification_secure
  AFTER INSERT OR UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_on_friend_request_secure();

-- ============================================================================
-- PART 3: Like Notifications Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS insight_like_notification_secure ON insight_likes;
DROP FUNCTION IF EXISTS notify_on_like_secure();

CREATE FUNCTION notify_on_like_secure()
RETURNS TRIGGER AS $$
DECLARE
  content_owner_id UUID;
  content_type_name TEXT;
  content_title TEXT;
  content_id_value UUID;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'insight_likes' THEN
      SELECT author_id, 'insight', LEFT(content, 50)
      INTO content_owner_id, content_type_name, content_title
      FROM insights WHERE id = NEW.insight_id;
      content_id_value := NEW.insight_id;
    WHEN 'article_likes', 'paper_likes', 'book_likes' THEN
      RETURN NEW; -- Skip non-user content
  END CASE;

  IF content_owner_id IS NOT NULL THEN
    PERFORM create_notification_secure(
      content_owner_id,
      NEW.user_id,
      'like',
      content_type_name,
      content_id_value::TEXT,
      NULL,
      '/content/' || content_type_name || '/' || content_id_value::TEXT,
      jsonb_build_object('content_preview', content_title)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER insight_like_notification_secure
  AFTER INSERT ON insight_likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like_secure();

-- ============================================================================
-- PART 4: Comment Notifications Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS insight_comment_notification_secure ON insight_comments;
DROP FUNCTION IF EXISTS notify_on_comment_secure();

CREATE FUNCTION notify_on_comment_secure()
RETURNS TRIGGER AS $$
DECLARE
  content_owner_id UUID;
  content_type_name TEXT;
  content_id_value TEXT;
  parent_comment_owner_id UUID;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'insight_comments' THEN
      SELECT author_id INTO content_owner_id FROM insights WHERE id = NEW.insight_id;
      content_type_name := 'insight';
      content_id_value := NEW.insight_id::TEXT;
    WHEN 'comments' THEN
      content_owner_id := NULL;
      content_type_name := 'article';
      content_id_value := NEW.article_id::TEXT;
  END CASE;

  -- Notify content owner
  IF content_owner_id IS NOT NULL AND content_owner_id != NEW.user_id THEN
    PERFORM create_notification_secure(
      content_owner_id,
      NEW.user_id,
      'comment',
      content_type_name,
      content_id_value,
      NULL,
      '/content/' || content_type_name || '/' || content_id_value || '#comment-' || NEW.id
    );
  END IF;

  -- Handle replies
  IF NEW.parent_comment_id IS NOT NULL THEN
    CASE TG_TABLE_NAME
      WHEN 'insight_comments' THEN
        SELECT user_id INTO parent_comment_owner_id FROM insight_comments WHERE id = NEW.parent_comment_id;
      WHEN 'comments' THEN
        SELECT user_id INTO parent_comment_owner_id FROM comments WHERE id = NEW.parent_comment_id;
    END CASE;

    IF parent_comment_owner_id IS NOT NULL
       AND parent_comment_owner_id != NEW.user_id
       AND parent_comment_owner_id != content_owner_id THEN
      PERFORM create_notification_secure(
        parent_comment_owner_id,
        NEW.user_id,
        'reply',
        content_type_name,
        content_id_value,
        NULL,
        '/content/' || content_type_name || '/' || content_id_value || '#comment-' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER insight_comment_notification_secure
  AFTER INSERT ON insight_comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment_secure();

-- ============================================================================
-- PART 5: Friend Insight Notifications Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS notify_friends_on_insight ON insights;
DROP FUNCTION IF EXISTS notify_friends_on_new_insight();

CREATE FUNCTION notify_friends_on_new_insight()
RETURNS TRIGGER AS $$
DECLARE
  friend_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  FOR friend_record IN
    SELECT DISTINCT
      CASE
        WHEN f.requester_id = NEW.author_id THEN f.addressee_id
        WHEN f.addressee_id = NEW.author_id THEN f.requester_id
      END as friend_id
    FROM friendships f
    WHERE f.status = 'accepted'
      AND (f.requester_id = NEW.author_id OR f.addressee_id = NEW.author_id)
  LOOP
    PERFORM create_notification_secure(
      friend_record.friend_id,
      NEW.author_id,
      'friend_insight',
      'insight',
      NEW.id::TEXT,
      NULL,
      '/insight/' || NEW.id,
      jsonb_build_object('high_priority', false, 'insight_preview', LEFT(NEW.content, 100)),
      'social'
    );
    notification_count := notification_count + 1;
  END LOOP;

  IF notification_count > 0 THEN
    RAISE NOTICE 'Created % friend insight notification(s) for insight %', notification_count, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_friends_on_insight
  AFTER INSERT ON insights
  FOR EACH ROW EXECUTE FUNCTION notify_friends_on_new_insight();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ COMPLETE NOTIFICATION SYSTEM V3 DEPLOYED' as status;
SELECT 'Includes: friend_request, friend_accepted, friend_insight, likes, comments' as features;
SELECT 'Uses HTTP push delivery for immediate notifications' as delivery_method;
