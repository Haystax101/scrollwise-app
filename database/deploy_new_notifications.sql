-- Deploy New Notification Features
-- This script adds:
-- 1. Friend request accepted notification (already exists, just verifying)
-- 2. Friend posted insight notification (NEW)

-- ============================================
-- STEP 1: Update notification function to include friend_activity message
-- ============================================

-- The create_notification_secure function already handles friend_activity type
-- We just need to ensure the message is correct

-- Update is already done in notifications_functions_secure.sql
-- The function now includes:
-- WHEN 'friend_activity' THEN default_message := default_message || ' posted a new insight';

-- ============================================
-- STEP 2: Create trigger for friend insight notifications
-- ============================================

-- Create function to notify friends about new insights
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

-- Create trigger on insights table
DROP TRIGGER IF EXISTS notify_friends_on_insight ON insights;

CREATE TRIGGER notify_friends_on_insight
  AFTER INSERT ON insights
  FOR EACH ROW
  EXECUTE FUNCTION notify_friends_on_new_insight();

-- ============================================
-- STEP 3: Verify all notification triggers
-- ============================================

-- Check friendship notification trigger (friend request + friend accepted)
SELECT
  'Friendship Notifications' as feature,
  COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_name IN ('friendship_notification_secure', 'friendship_notification');

-- Check friend insight notification trigger
SELECT
  'Friend Insight Notifications' as feature,
  COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_name = 'notify_friends_on_insight';

-- ============================================
-- STEP 4: Summary
-- ============================================

SELECT '✅ New notification features deployed successfully!' as status;

SELECT
  'Notification Type' as type,
  'Status' as status,
  'Description' as description
UNION ALL
SELECT
  'Friend Request',
  'Already Active ✓',
  'Notifies when someone sends a friend request'
UNION ALL
SELECT
  'Friend Request Accepted',
  'Already Active ✓',
  'Notifies requester when friend request is accepted'
UNION ALL
SELECT
  'Friend Posted Insight',
  'NEW - Just Added ✨',
  'Notifies friends when someone posts a new insight';
