-- NUCLEAR OPTION: Nuke and Rebuild log_interaction
-- Run this in Supabase SQL Editor

-- 1. Dynamically Drop ALL functions named 'log_interaction'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'log_interaction'
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', r.func_signature;
    END LOOP;
END $$;

-- 2. Re-Create the Definitive Function
CREATE OR REPLACE FUNCTION public.log_interaction(
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

-- 3. Fix Permissions & Partitions (Idempotent)
-- Ensure Partitions
CREATE TABLE IF NOT EXISTS public.learning_sessions_2026_01 PARTITION OF public.learning_sessions_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS public.learning_sessions_2026_02 PARTITION OF public.learning_sessions_partitioned
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Grants
GRANT ALL ON TABLE public.learning_sessions_partitioned TO authenticated;
GRANT ALL ON TABLE public.learning_sessions_partitioned TO service_role;
GRANT ALL ON TABLE public.learning_sessions_2026_01 TO authenticated;
GRANT ALL ON TABLE public.learning_sessions_2026_02 TO authenticated;

-- RLS
ALTER TABLE public.learning_sessions_partitioned ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.learning_sessions_partitioned;
CREATE POLICY "Users can manage their own sessions"
ON public.learning_sessions_partitioned
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify
ALTER FUNCTION log_interaction OWNER TO postgres;
