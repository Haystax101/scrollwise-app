-- Migration for Depth Tracking & Real-time Persistence
-- Run this in Supabase SQL Editor

ALTER TABLE public.learning_sessions_partitioned 
ADD COLUMN IF NOT EXISTS max_scroll_depth integer DEFAULT 0 CHECK (max_scroll_depth >= 0 AND max_scroll_depth <= 100),
ADD COLUMN IF NOT EXISTS slides_viewed integer DEFAULT 0 CHECK (slides_viewed >= 0),
ADD COLUMN IF NOT EXISTS total_slides integer DEFAULT 0 CHECK (total_slides >= 0),
ADD COLUMN IF NOT EXISTS session_id uuid;

-- Drop previous overloaded signatures to fix ambiguity
DROP FUNCTION IF EXISTS log_interaction(bigint, text, integer, numeric, text, uuid);
DROP FUNCTION IF EXISTS log_interaction(bigint, text, integer, numeric, text, uuid, integer, integer, integer);
DROP FUNCTION IF EXISTS log_interaction(bigint, text, integer, numeric, text, uuid, integer, integer, integer, uuid);

CREATE OR REPLACE FUNCTION log_interaction(
  p_content_id bigint,
  p_content_type text,
  p_duration_seconds integer,
  p_completion_percentage numeric,
  p_time_of_day text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_max_scroll_depth integer DEFAULT 0,
  p_slides_viewed integer DEFAULT 0,
  p_total_slides integer DEFAULT 0,
  p_session_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Use authenticated user if available, otherwise fallback to provided ID
  v_user_id := COALESCE(auth.uid(), p_user_id);
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user_id provided. Must be logged in or provide p_user_id.';
  END IF;

  -- Attempt Update if session_id is provided
  IF p_session_id IS NOT NULL THEN
    UPDATE public.learning_sessions_partitioned
    SET 
        duration_seconds = GREATEST(duration_seconds, p_duration_seconds),
        completion_percentage = GREATEST(completion_percentage, p_completion_percentage),
        max_scroll_depth = GREATEST(max_scroll_depth, p_max_scroll_depth),
        slides_viewed = GREATEST(slides_viewed, p_slides_viewed),
        session_end_time = now()
    WHERE session_id = p_session_id;
    
    IF FOUND THEN
        RETURN;
    END IF;
  END IF;

  -- Fallback to Insert
  INSERT INTO public.learning_sessions_partitioned (
    user_id,
    content_id,
    content_type,
    duration_seconds,
    completion_percentage,
    max_scroll_depth,
    slides_viewed,
    total_slides,
    session_start_time,
    session_end_time,
    created_at,
    session_id
  ) VALUES (
    v_user_id,
    p_content_id,
    p_content_type,
    p_duration_seconds,
    p_completion_percentage,
    p_max_scroll_depth,
    p_slides_viewed,
    p_total_slides,
    now() - (p_duration_seconds || ' seconds')::interval,
    now(),
    now(),
    p_session_id
  );
END;
$$;
