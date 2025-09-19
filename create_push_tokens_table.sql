-- Create push_tokens table for storing device push notification tokens
-- This table is needed for the notification system to work properly

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT push_tokens_unique_user_token UNIQUE (user_id, token)
);

-- Enable RLS on the push_tokens table
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for push_tokens
CREATE POLICY "Users can manage their own push tokens" ON public.push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS push_tokens_active_idx ON public.push_tokens(is_active) WHERE is_active = true;

-- Add notification preferences to profiles table if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
  "learning_reminders": true,
  "friend_activity": true,
  "achievement_unlocked": true,
  "weekly_summary": true
}'::jsonb;

-- Add index for notification preferences
CREATE INDEX IF NOT EXISTS profiles_notification_preferences_idx ON public.profiles USING gin(notification_preferences);