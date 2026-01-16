-- FIX: RPC Function Mismatch
-- Run this in Supabase SQL Editor

-- 1. Explicitly DROP the specific old signature mentioned in the error hint
-- "public.log_interaction(p_completion_percentage, p_content_id, p_content_type, p_duration_seconds, p_max_scroll_depth, p_session_id, p_slides_viewed, p_time_of_day, p_total_slides, p_user_id)"

DROP FUNCTION IF EXISTS public.log_interaction(
    numeric, -- p_completion_percentage
    bigint,  -- p_content_id
    text,    -- p_content_type
    integer, -- p_duration_seconds
    integer, -- p_max_scroll_depth
    uuid,    -- p_session_id
    integer, -- p_slides_viewed
    text,    -- p_time_of_day (based on hint)
    integer, -- p_total_slides
    uuid     -- p_user_id
);

-- Also try dropping without types slightly different just in case (e.g. without time_of_day if that was added/removed)
DROP FUNCTION IF EXISTS public.log_interaction(
    bigint, text, uuid, integer, integer, integer, uuid, numeric
);

-- 2. Re-Run the "Nuclear" Drop Loop just to be sure (Clean Slate)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure AS func_signature, proname, proargnames
        FROM pg_proc
        WHERE proname = 'log_interaction'
        AND pronamespace = 'public'::regnamespace
    LOOP
        RAISE NOTICE 'Dropping function: %', r.func_signature;
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- 3. Re-Create the Definitive Simplified RPC (Matches hooks/useContentTracking.ts)
-- Params: p_content_id, p_content_type, p_user_id, p_max_scroll_depth, p_slides_viewed, p_total_slides, p_session_id
CREATE OR REPLACE FUNCTION public.log_interaction(
  p_content_id bigint,
  p_content_type text,
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
  -- Resolve User ID
  v_user_id := COALESCE(auth.uid(), p_user_id);
  
  IF v_user_id IS NULL THEN
    -- If no user, we can't log. Simply return or raise warning.
    -- RAISE NOTICE 'No user_id provided for % %', p_content_type, p_content_id;
    RETURN; 
  END IF;

  -- Upsert Logic (Update existing session if ID provided)
  IF p_session_id IS NOT NULL THEN
    UPDATE public.learning_sessions_partitioned
    SET 
        max_scroll_depth = GREATEST(max_scroll_depth, p_max_scroll_depth),
        slides_viewed = GREATEST(slides_viewed, p_slides_viewed),
        session_end_time = now(),
        updated_at = now()
    WHERE session_id = p_session_id;
    
    IF FOUND THEN
        RETURN;
    END IF;
  END IF;

  -- Insert Logic (New Session)
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
    updated_at,
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
    now(),
    p_session_id
  );
END;
$$;

-- 4. Grant Permissions
ALTER FUNCTION log_interaction OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.log_interaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_interaction TO service_role;
