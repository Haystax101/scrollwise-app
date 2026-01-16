-- Log Interaction RPC Function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION log_interaction(
  p_content_id bigint,
  p_content_type text,
  p_duration_seconds integer,
  p_completion_percentage numeric,
  p_time_of_day text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL -- Optional override for testing
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Use authenticated user if available, otherwise fallback to provided ID (for testing)
  v_user_id := COALESCE(auth.uid(), p_user_id);
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user_id provided. Must be logged in or provide p_user_id.';
  END IF;

  INSERT INTO public.learning_sessions (
    user_id,
    content_id,
    content_type,
    duration_seconds,
    completion_percentage,
    session_start_time,
    session_end_time,
    created_at
  ) VALUES (
    v_user_id,
    p_content_id,
    p_content_type,
    p_duration_seconds,
    p_completion_percentage,
    now() - (p_duration_seconds || ' seconds')::interval,
    now(),
    now()
  );
END;
$$;
