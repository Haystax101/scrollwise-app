-- FIX: Permissions & Partitions for Depth Tracking
-- Run this in Supabase SQL Editor

-- 1. Ensure Partitions Exist for 2026 (Crucial for current date)
CREATE TABLE IF NOT EXISTS public.learning_sessions_2026_01 PARTITION OF public.learning_sessions_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS public.learning_sessions_2026_02 PARTITION OF public.learning_sessions_partitioned
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- 2. Grant Permissions to Authenticated Users
GRANT ALL ON TABLE public.learning_sessions_partitioned TO authenticated;
GRANT ALL ON TABLE public.learning_sessions_partitioned TO service_role;
GRANT ALL ON TABLE public.learning_sessions_2026_01 TO authenticated;
GRANT ALL ON TABLE public.learning_sessions_2026_01 TO service_role;
-- (Repeat for other partitions if generated dynamically, but parent grant usually suffices for inherited)

-- 3. Setup Row Level Security (RLS)
ALTER TABLE public.learning_sessions_partitioned ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.learning_sessions_partitioned;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.learning_sessions_partitioned;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.learning_sessions_partitioned;

-- Create comprehensive policy
CREATE POLICY "Users can manage their own sessions"
ON public.learning_sessions_partitioned
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Verify RPC Ownership (Security Definer runs as owner, ensuring bypassing of strict RLS if needed, though mostly redundant with above policy)
ALTER FUNCTION log_interaction OWNER TO postgres;

-- 5. TEST: Attempt a manual call (You should see a "Success" message if run in Editor)
-- DO $$
-- BEGIN
--   PERFORM log_interaction(
--     p_content_id := 1, 
--     p_content_type := 'test_article', 
--     p_duration_seconds := 10,
--     p_completion_percentage := 50, 
--     p_user_id := auth.uid(), -- Uses current user in Editor
--     p_max_scroll_depth := 50,
--     p_slides_viewed := 1,
--     p_total_slides := 5,
--     p_session_id := gen_random_uuid()
--   );
-- END $$;
