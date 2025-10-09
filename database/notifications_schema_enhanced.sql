-- Enhanced Notifications Database Schema
-- Addresses 2025 security, performance, and scalability requirements

-- Step 1: Enhance existing notifications table
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'general' CHECK (channel = ANY (ARRAY[
  'social', 'learning', 'system', 'general'
]));

-- Update notification types to include new ones
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
CHECK (type = ANY (ARRAY[
  'like', 'comment', 'friend_request', 'friend_accepted',
  'save', 'share', 'streak_reminder', 'goal_achievement',
  'friend_insight', 'milestone', 'reply', 'digest'
]));

-- Step 2: Create push tokens table with RLS
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type = ANY (ARRAY['ios', 'android', 'web'])),
  app_version TEXT,
  os_version TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- Enable RLS on push tokens
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for push tokens
CREATE POLICY "Users can manage their own push tokens"
  ON public.user_push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 3: Create notification preferences with Android channels support
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Channel preferences
  social_notifications BOOLEAN DEFAULT TRUE,
  learning_notifications BOOLEAN DEFAULT TRUE,
  system_notifications BOOLEAN DEFAULT TRUE,

  -- Type-specific preferences
  friend_requests BOOLEAN DEFAULT TRUE,
  likes BOOLEAN DEFAULT TRUE,
  comments BOOLEAN DEFAULT TRUE,
  saves BOOLEAN DEFAULT TRUE,
  friend_activity BOOLEAN DEFAULT TRUE,
  streak_reminders BOOLEAN DEFAULT TRUE,
  goal_achievements BOOLEAN DEFAULT TRUE,

  -- Delivery preferences
  digest_frequency TEXT DEFAULT 'immediate' CHECK (digest_frequency = ANY (ARRAY[
    'immediate', 'batched_5min', 'hourly', 'daily', 'weekly', 'off'
  ])),

  -- Quiet hours with timezone support
  quiet_hours_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'GMT',

  -- Override settings
  high_priority_override BOOLEAN DEFAULT TRUE, -- Allow friend requests during quiet hours

  -- Android notification channel settings
  android_social_channel_id TEXT DEFAULT 'social',
  android_learning_channel_id TEXT DEFAULT 'learning',
  android_system_channel_id TEXT DEFAULT 'system',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on preferences
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for preferences
CREATE POLICY "Users can manage their own notification preferences"
  ON public.user_notification_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 4: Create notification batching table for rate limiting
CREATE TABLE IF NOT EXISTS public.notification_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  content_type TEXT,
  content_id TEXT,
  batch_key TEXT NOT NULL, -- For grouping similar notifications
  count INTEGER DEFAULT 1,
  last_notification_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes',
  UNIQUE(user_id, batch_key)
);

-- Enable RLS on batches
ALTER TABLE public.notification_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies for batches
CREATE POLICY "Users can view their own notification batches"
  ON public.notification_batches
  FOR SELECT
  USING (auth.uid() = user_id);

-- Step 5: Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON public.notifications (user_id, created_at DESC)
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_batch_id
ON public.notifications (batch_id)
WHERE batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_push_queue
ON public.notifications (created_at)
WHERE push_sent = false;

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active
ON public.user_push_tokens (user_id)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_notification_batches_expires
ON public.notification_batches (expires_at);

-- Step 6: Cleanup job for expired batches and old notifications
CREATE OR REPLACE FUNCTION cleanup_notifications()
RETURNS void AS $$
BEGIN
  -- Clean up expired batches
  DELETE FROM notification_batches
  WHERE expires_at < NOW();

  -- Archive old notifications (90-day retention)
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Deactivate old push tokens (6 months inactive)
  UPDATE user_push_tokens
  SET is_active = false
  WHERE updated_at < NOW() - INTERVAL '6 months'
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Rate limiting function
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

-- Step 8: Auto-cleanup schedule (requires pg_cron)
-- This will be set up separately in cron jobs

-- Verification queries
SELECT
  'ENHANCED SCHEMA DEPLOYED' as status,
  'Ready for modern notification system' as message;

-- Show table counts
SELECT
  'user_push_tokens' as table_name,
  COUNT(*) as record_count
FROM user_push_tokens
UNION ALL
SELECT
  'user_notification_preferences' as table_name,
  COUNT(*) as record_count
FROM user_notification_preferences
UNION ALL
SELECT
  'notification_batches' as table_name,
  COUNT(*) as record_count
FROM notification_batches;

-- Show indexes
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename IN ('notifications', 'user_push_tokens', 'notification_batches')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;