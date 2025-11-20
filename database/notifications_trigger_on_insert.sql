-- Notification Trigger-Based Push Delivery System
-- This trigger fires on INSERT to notifications table and sends push notification automatically
-- More reliable than inline HTTP calls in functions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- We use a simple shared secret for authenticating database->edge function calls
-- This secret is set in two places:
-- 1. In Vault (for PostgreSQL to read)
-- 2. As an Edge Function secret (for the function to verify)

-- Create private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- Create a function to retrieve the function secret from Vault
CREATE OR REPLACE FUNCTION private.get_function_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = 'edge_function_secret';

  IF secret_value IS NULL THEN
    RAISE WARNING 'Function secret not found in vault. Please add it with: SELECT vault.create_secret(''your-secret-here'', ''edge_function_secret'');';
  END IF;

  RETURN secret_value;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_send_push_on_notification_insert ON notifications;
DROP FUNCTION IF EXISTS send_push_notification_on_insert();

-- Create trigger function that sends push notification on INSERT
CREATE OR REPLACE FUNCTION send_push_notification_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  should_send BOOLEAN := FALSE;
  user_prefs RECORD;
BEGIN
  -- Only process if push_sent is false (not already sent)
  IF NEW.push_sent = true THEN
    RETURN NEW;
  END IF;

  -- Get user notification preferences to check digest settings
  SELECT * INTO user_prefs
  FROM user_notification_preferences
  WHERE user_id = NEW.user_id;

  -- Determine if we should send immediately based on preferences
  -- Send immediately if:
  -- 1. User has immediate digest frequency OR
  -- 2. It's a high-priority notification type (friend_request, streak_reminder)
  IF user_prefs IS NULL OR
     user_prefs.digest_frequency = 'immediate' OR
     user_prefs.digest_frequency IS NULL OR
     NEW.type IN ('friend_request', 'streak_reminder', 'goal_achievement', 'friend_accepted') THEN
    should_send := TRUE;
  END IF;

  -- Also send if it's already part of a batch being processed (batch_id set but not by batching logic)
  IF NEW.batch_id IS NOT NULL AND should_send = FALSE THEN
    -- Check if this is a digest notification
    IF NEW.type = 'digest' THEN
      should_send := TRUE;
    END IF;
  END IF;

  -- Send push notification via HTTP to edge function
  IF should_send THEN
    DECLARE
      func_secret TEXT;
    BEGIN
      -- Get function secret from Vault
      func_secret := private.get_function_secret();

      IF func_secret IS NULL THEN
        RAISE WARNING 'Cannot send push notification: function secret not configured in Vault';
        RETURN NEW;
      END IF;

      -- Use pg_net for async HTTP request (non-blocking)
      -- Uses custom X-Function-Secret header instead of Authorization
      PERFORM net.http_post(
        url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Function-Secret', func_secret
        ),
        body := jsonb_build_object(
          'notification_id', NEW.id,
          'user_id', NEW.user_id,
          'type', NEW.type,
          'message', NEW.message,
          'channel', NEW.channel,
          'batch_id', NEW.batch_id
        )
      );

      -- Update push_sent to true immediately to prevent duplicate sends
      -- The edge function will update push_sent_at on successful delivery
      UPDATE notifications
      SET push_sent = true
      WHERE id = NEW.id;

      RAISE NOTICE 'Push notification queued for notification %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to queue push notification for %: %', NEW.id, SQLERRM;
        -- Don't update push_sent, so it can be retried
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_send_push_on_notification_insert
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification_on_insert();

-- Update send-push-notification to also set push_sent_at
-- This RPC function can be called to mark notifications as sent
CREATE OR REPLACE FUNCTION mark_notification_sent(
  notification_id_param UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET
    push_sent = true,
    push_sent_at = NOW()
  WHERE id = notification_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retry failed notifications (can be called manually or via cron)
CREATE OR REPLACE FUNCTION retry_failed_notifications()
RETURNS INTEGER AS $$
DECLARE
  failed_notification RECORD;
  retry_count INTEGER := 0;
  func_secret TEXT;
BEGIN
  -- Get function secret from Vault
  func_secret := private.get_function_secret();

  IF func_secret IS NULL THEN
    RAISE WARNING 'Cannot retry notifications: function secret not configured in Vault';
    RETURN 0;
  END IF;

  -- Find notifications that haven't been sent in the last hour
  FOR failed_notification IN
    SELECT * FROM notifications
    WHERE push_sent = false
      AND created_at > NOW() - INTERVAL '24 hours'
      AND created_at < NOW() - INTERVAL '5 minutes'  -- Give 5 min before retry
    ORDER BY created_at ASC
    LIMIT 100  -- Process in batches
  LOOP
    BEGIN
      PERFORM net.http_post(
        url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Function-Secret', func_secret
        ),
        body := jsonb_build_object(
          'notification_id', failed_notification.id,
          'user_id', failed_notification.user_id,
          'type', failed_notification.type,
          'message', failed_notification.message,
          'channel', failed_notification.channel,
          'batch_id', failed_notification.batch_id
        )
      );

      -- Mark as sent
      UPDATE notifications
      SET push_sent = true
      WHERE id = failed_notification.id;

      retry_count := retry_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to retry notification %: %', failed_notification.id, SQLERRM;
    END;
  END LOOP;

  RETURN retry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
SELECT
  'NOTIFICATION INSERT TRIGGER DEPLOYED' as status,
  'Push notifications will now be sent automatically on INSERT' as message;

-- =====================================================
-- SETUP: Configure the shared secret
-- =====================================================
-- This system uses a custom secret (not service_role) for auth.
-- You need to set it in TWO places:
--
-- 1. In Vault (for PostgreSQL to read):
--    SELECT vault.create_secret(
--      'your-random-secret-string-here',
--      'edge_function_secret',
--      'Secret for authenticating database to edge function calls'
--    );
--
-- 2. In Edge Function Secrets (Dashboard > Edge Functions > Secrets):
--    Name: FUNCTION_SECRET
--    Value: your-random-secret-string-here (same as above)
--
-- Generate a secure random string:
--    openssl rand -base64 32
--
-- To verify Vault is set correctly:
--    SELECT * FROM vault.decrypted_secrets WHERE name = 'edge_function_secret';
--
-- Then deploy the edge function with --no-verify-jwt:
--    supabase functions deploy send-push-notification --no-verify-jwt
-- =====================================================
