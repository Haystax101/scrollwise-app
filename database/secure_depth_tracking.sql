-- SECURITY FIX: Enable RLS on all Depth Tracking Tables
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on Parent Table (Should already be enabled, but enforcing it)
ALTER TABLE public.learning_sessions_partitioned ENABLE ROW LEVEL SECURITY;

-- 2. CRITICAL: Enable RLS on Partitions explicitly
-- (Supabase UI often flags partitions as unrestricted if RLS isn't explicitly on, even if inherited)
ALTER TABLE public.learning_sessions_2026_01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions_2026_02 ENABLE ROW LEVEL SECURITY;

-- 3. Ensure Policy Exists on Parent (Inherited by partitions automatically for queries via parent)
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.learning_sessions_partitioned;

CREATE POLICY "Users can manage their own sessions"
ON public.learning_sessions_partitioned
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. (Optional) Sanity Check for 'learning_sessions' vs 'learning_sessions_partitioned'
-- If there is mistakenly an old 'learning_sessions' table that is empty and confusing you:
-- DROP TABLE IF EXISTS public.learning_sessions; 
-- (Only uncomment above if you are sure 'learning_sessions' is unused/legacy)
