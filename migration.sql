-- Post-Launch Database Migration
-- Run this file against your Supabase PostgreSQL database

-- 1. Create notifications table for likes/comments on insights
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['like'::text, 'comment'::text, 'friend_request'::text])),
  source_user_id uuid NOT NULL,
  content_type text CHECK (content_type = ANY (ARRAY['insight'::text, 'article'::text, 'paper'::text, 'book'::text])),
  content_id text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_source_user_id_fkey FOREIGN KEY (source_user_id) REFERENCES public.profiles(id)
);

-- 2. Rename existing bio field to tagline and add length constraint
ALTER TABLE public.profiles RENAME COLUMN bio TO tagline;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tagline_length CHECK (length(tagline) <= 100);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Set up Row Level Security (RLS) for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: System can insert notifications for any user (for backend processes)
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);