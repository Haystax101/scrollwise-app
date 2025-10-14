-- Add notification trigger for when friends post insights
-- This notifies users when their friends create new insights

-- Step 1: Create function to notify friends about new insights
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
    PERFORM create_notification_secure(
      friend_record.friend_id,      -- recipient (the friend)
      NEW.author_id,                 -- source user (insight author)
      'friend_activity',             -- notification type
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
    RAISE NOTICE 'Created % friend activity notification(s) for insight %', notification_count, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger on insights table
DROP TRIGGER IF EXISTS notify_friends_on_insight ON insights;

CREATE TRIGGER notify_friends_on_insight
  AFTER INSERT ON insights
  FOR EACH ROW
  EXECUTE FUNCTION notify_friends_on_new_insight();

-- Step 3: Update the default message for friend_activity notifications
-- This is already handled in create_notification_secure, but let's verify the message format

-- Verify trigger was created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'notify_friends_on_insight';

SELECT 'Friend insight notifications trigger created successfully' as status;
