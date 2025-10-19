-- Deploy ONLY the friend request/accepted notification trigger
-- Use this if likes/comments are already working but friend requests are not

DROP TRIGGER IF EXISTS friendship_notification_secure ON friendships;
DROP FUNCTION IF EXISTS notify_on_friend_request_secure();

CREATE FUNCTION notify_on_friend_request_secure()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Friend request trigger fired: NEW.status=%, OLD.status=%', NEW.status, COALESCE(OLD.status::text, 'NULL');

  IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status IS NULL) THEN
    -- New friend request
    RAISE NOTICE 'Creating friend_request notification for user % from user %', NEW.addressee_id, NEW.requester_id;

    PERFORM create_notification_secure(
      NEW.addressee_id,              -- recipient (person receiving the request)
      NEW.requester_id,              -- source (person sending the request)
      'friend_request',              -- notification type
      NULL,                          -- content_type
      NEW.id::TEXT,                  -- content_id (friendship id)
      NULL,                          -- custom_message
      '/profile/' || NEW.requester_id,  -- action_url
      jsonb_build_object('high_priority', true)  -- additional_data
    );

    RAISE NOTICE 'Friend request notification created successfully';

  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Friend request accepted - notify the requester
    RAISE NOTICE 'Creating friend_accepted notification for user % from user %', NEW.requester_id, NEW.addressee_id;

    PERFORM create_notification_secure(
      NEW.requester_id,              -- recipient (original requester)
      NEW.addressee_id,              -- source (person who accepted)
      'friend_accepted',             -- notification type
      NULL,                          -- content_type
      NEW.id::TEXT,                  -- content_id (friendship id)
      NULL,                          -- custom_message
      '/profile/' || NEW.addressee_id,  -- action_url
      jsonb_build_object('high_priority', false)  -- additional_data
    );

    RAISE NOTICE 'Friend accepted notification created successfully';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER friendship_notification_secure
  AFTER INSERT OR UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_on_friend_request_secure();

-- Verify the trigger was created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'friendship_notification_secure';

SELECT '✅ Friend request notification trigger deployed' as status;
SELECT 'Test by sending a friend request - check database logs for NOTICE messages' as next_step;
