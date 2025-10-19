-- DEPLOYMENT SCRIPT: Fix Insight Publishing Issue
-- Problem: Users cannot publish insights because the friend notification trigger
--          uses 'friend_activity' type but the notifications table CHECK constraint
--          only allows 'friend_insight'
-- Solution: Update notification functions to handle 'friend_insight' and update trigger

-- ============================================================================
-- STEP 1: Update create_notification_secure function to handle 'friend_insight'
-- ============================================================================

\echo 'Step 1: Updating create_notification_secure function...'

-- This is the complete updated function from notifications_functions_secure.sql
\i database/notifications_functions_secure.sql

\echo 'Step 1 complete: Notification functions updated'

-- ============================================================================
-- STEP 2: Update friend insight notification trigger
-- ============================================================================

\echo 'Step 2: Updating friend insight notification trigger...'

-- Drop and recreate with correct notification type
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
      'friend_insight',              -- notification type (FIXED: was 'friend_activity')
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

-- Recreate trigger on insights table
DROP TRIGGER IF EXISTS notify_friends_on_insight ON insights;

CREATE TRIGGER notify_friends_on_insight
  AFTER INSERT ON insights
  FOR EACH ROW
  EXECUTE FUNCTION notify_friends_on_new_insight();

\echo 'Step 2 complete: Friend insight trigger updated'

-- ============================================================================
-- VERIFICATION
-- ============================================================================

\echo 'Verifying deployment...'

-- Check that the trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'notify_friends_on_insight';

-- Check that the function exists
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'notify_friends_on_new_insight';

\echo '✅ DEPLOYMENT COMPLETE'
\echo 'Insight publishing should now work correctly!'
\echo 'Test by publishing a new insight - it should succeed without errors.'
