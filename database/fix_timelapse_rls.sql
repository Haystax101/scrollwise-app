-- Enable RLS (if not already)
ALTER TABLE public.timelapse_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view their own timelapses" ON public.timelapse_sessions;
DROP POLICY IF EXISTS "Public timelapses are viewable by everyone" ON public.timelapse_sessions;
DROP POLICY IF EXISTS "Authenticated users can view timelapses" ON public.timelapse_sessions;

-- Create Broad Read Policy
-- This allows any authenticated user to SELECT rows.
-- We rely on client-side filtering (communityService.ts) to hide "Private" sessions 
-- and prioritize "Friends" content.
CREATE POLICY "Authenticated users can view timelapses"
ON public.timelapse_sessions
FOR SELECT
TO authenticated
USING (true);

-- Maintain Write Policy (Creators only)
DROP POLICY IF EXISTS "Users can insert their own timelapses" ON public.timelapse_sessions;
CREATE POLICY "Users can insert their own timelapses"
ON public.timelapse_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own timelapses" ON public.timelapse_sessions;
CREATE POLICY "Users can update their own timelapses"
ON public.timelapse_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own timelapses" ON public.timelapse_sessions;
CREATE POLICY "Users can delete their own timelapses"
ON public.timelapse_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
