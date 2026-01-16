-- CLEANUP: Simplify Learning Sessions Table & RPC
-- Run this in Supabase SQL Editor

-- 1. Drop unused/inaccurate columns from the parent table (propagates to partitions)
ALTER TABLE public.learning_sessions_partitioned
DROP COLUMN IF EXISTS duration_seconds,
DROP COLUMN IF EXISTS interaction_events,
DROP COLUMN IF EXISTS engagement_score,
DROP COLUMN IF EXISTS session_quality_score,
DROP COLUMN IF EXISTS device_type,
DROP COLUMN IF EXISTS referrer_source,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS bookmarks,
DROP COLUMN IF EXISTS quiz_score,
DROP COLUMN IF EXISTS is_completed; 
-- Keeping: id, user_id, content_type, content_id, session_start_time, session_end_time, created_at, updated_at
-- And the new ones: max_scroll_depth, slides_viewed, total_slides, session_id, completion_percentage (kept as useful summary)

-- 2. Drop old RPC signatures (Nuclear approach again to be safe)
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
    END LOOP;
END $$;

-- 3. Re-Create Simplified RPC
CREATE OR REPLACE FUNCTION public.log_interaction(
  p_content_id bigint,
  p_content_type text,
  p_user_id uuid DEFAULT NULL,
  p_max_scroll_depth integer DEFAULT 0,
  p_slides_viewed integer DEFAULT 0,
  p_total_slides integer DEFAULT 0,
  p_session_id uuid DEFAULT NULL
  -- p_completion_percentage numeric DEFAULT 0 -- Optional: Keep or drop? I'll drop it so "Depth" is the single source of truth as requested.
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := COALESCE(auth.uid(), p_user_id);
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user_id provided.';
  END IF;

  -- Upsert Logic
  IF p_session_id IS NOT NULL THEN
    UPDATE public.learning_sessions_partitioned
    SET 
        max_scroll_depth = GREATEST(max_scroll_depth, p_max_scroll_depth),
        slides_viewed = GREATEST(slides_viewed, p_slides_viewed),
        session_end_time = now()
    WHERE session_id = p_session_id;
    
    IF FOUND THEN
        RETURN;
    END IF;
  END IF;

  -- Insert Logic
  INSERT INTO public.learning_sessions_partitioned (
    user_id,
    content_id,
    content_type,
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
    p_max_scroll_depth,
    p_slides_viewed,
    p_total_slides,
    now(),
    now(),
    now(),
    p_session_id
  );
END;
$$;

-- 4. Restore Owner and Permissions (just in case DROP CASCADE wiped them)
ALTER FUNCTION log_interaction OWNER TO postgres;
GRANT ALL ON TABLE public.learning_sessions_partitioned TO authenticated;
GRANT ALL ON TABLE public.learning_sessions_partitioned TO service_role;
-- Partitions usually inherit, but good to ensure if script re-runs
