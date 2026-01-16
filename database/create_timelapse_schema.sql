-- Timelapse Feature Schema
-- Run this in Supabase SQL Editor

-- 1. Create Table: timelapse_sessions
CREATE TABLE IF NOT EXISTS public.timelapse_sessions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    duration_seconds integer DEFAULT 0,
    photos_count integer DEFAULT 0,
    storage_path text, -- e.g. "user_id/session_id/"
    voltz_earned integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT timelapse_sessions_pkey PRIMARY KEY (id)
);

-- 2. RLS for Table
ALTER TABLE public.timelapse_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own timelapse sessions"
ON public.timelapse_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own timelapse sessions"
ON public.timelapse_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own timelapse sessions"
ON public.timelapse_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Create Storage Bucket: 'timelapse-images'
-- Note: If you prefer creating buckets manually via UI, you can skip the INSERT.
INSERT INTO storage.buckets (id, name, public)
VALUES ('timelapse-images', 'timelapse-images', false) -- Private by default? Or public? Let's make it public for easier display for now.
ON CONFLICT (id) DO NOTHING;

-- 4. RLS for Storage Bucket
CREATE POLICY "Users can upload timelapse images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'timelapse-images'
  -- Enforce path structure: user_id/session_id/filename
  -- AND (storage.foldername(name))[1] = auth.uid()::text 
);

CREATE POLICY "Users can view own timelapse images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'timelapse-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Grant permissions
GRANT ALL ON TABLE public.timelapse_sessions TO authenticated;
GRANT ALL ON TABLE public.timelapse_sessions TO service_role;
