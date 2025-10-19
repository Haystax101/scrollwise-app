-- Complete fix for friend insight notifications
-- Issue: 'friend_activity' is used in code but 'friend_insight' is required by CHECK constraint
-- Solution: Map 'friend_activity' to 'friend_insight' when inserting notifications

-- Step 1: Update notifications_functions_secure.sql to map friend_activity to friend_insight
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
  db_notification_type TEXT; -- The type to actually insert into DB
BEGIN
  -- Input validation and sanitization
  IF recipient_id IS NULL OR source_user_id IS NULL OR notification_type IS NULL THEN
    RAISE WARNING 'create_notification_secure: Missing required parameters';
    RETURN NULL;
  END IF;

  -- Map notification types for database compatibility
  -- The preferences table uses 'friend_activity' but the notifications CHECK constraint uses 'friend_insight'
  db_notification_type := notification_type;
  IF notification_type = 'friend_activity' THEN
    db_notification_type := 'friend_insight';
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

  -- Check if user wants this type of notification (using original type for preferences)
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

  -- Handle batching for appropriate notification types
  IF should_batch AND user_prefs.digest_frequency != 'immediate' THEN
    batch_key := recipient_id::TEXT || '_' || notification_type || '_' || COALESCE(content_type, 'general');

    SELECT * INTO existing_batch
    FROM notification_batches
    WHERE user_id = recipient_id
      AND notification_type = notification_type
      AND status = 'pending'
      AND created_at > (NOW() - INTERVAL '5 minutes')
    ORDER BY created_at DESC
    LIMIT 1;

    IF existing_batch.id IS NOT NULL THEN
      batch_id := existing_batch.id;
    ELSE
      INSERT INTO notification_batches (user_id, notification_type, content_type)
      VALUES (recipient_id, notification_type, content_type)
      RETURNING id INTO batch_id;
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

  -- Insert notification with mapped type
  INSERT INTO notifications (
    user_id, source_user_id, type, content_type, content_id,
    message, action_url, data, batch_id, channel
  ) VALUES (
    recipient_id, source_user_id, db_notification_type, content_type, content_id,
    default_message, action_url, additional_data, batch_id, channel_name
  ) RETURNING id INTO notification_id;

  -- Update batch with latest notification
  IF batch_id IS NOT NULL THEN
    UPDATE notification_batches
    SET
      notification_count = notification_count + 1,
      last_notification_id = notification_id,
      updated_at = NOW()
    WHERE id = batch_id;
  END IF;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update the friend insight trigger to use 'friend_activity' (which gets mapped to 'friend_insight')
DROP FUNCTION IF EXISTS notify_friends_on_new_insight() CASCADE;

CREATE FUNCTION notify_friends_on_new_insight()
RETURNS TRIGGER AS $$
DECLARE
  friend_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Only process on INSERT (new insights)
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Get all friends of the insight author
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
    -- Create notification for each friend
    -- Using 'friend_activity' which will be mapped to 'friend_insight' by the function
    PERFORM create_notification_secure(
      friend_record.friend_id,      -- recipient (the friend)
      NEW.author_id,                 -- source user (insight author)
      'friend_activity',             -- notification type (maps to friend_insight in DB)
      'insight',                     -- content type
      NEW.id::TEXT,                  -- content id
      NULL,                          -- custom message (will use default)
      '/insight/' || NEW.id,         -- action url
      jsonb_build_object(
        'high_priority', false,
        'insight_preview', LEFT(NEW.content, 100)
      ),
      'social'                       -- channel override
    );

    notification_count := notification_count + 1;
  END LOOP;

  -- Log for monitoring
  IF notification_count > 0 THEN
    RAISE NOTICE 'Created % friend insight notification(s) for insight %', notification_count, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate trigger on insights table
DROP TRIGGER IF EXISTS notify_friends_on_insight ON insights;

CREATE TRIGGER notify_friends_on_insight
  AFTER INSERT ON insights
  FOR EACH ROW
  EXECUTE FUNCTION notify_friends_on_new_insight();

-- Step 4: Verify the fix
SELECT 'Friend insight notifications fixed - friend_activity now maps to friend_insight in DB' as status;
