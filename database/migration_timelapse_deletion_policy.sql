-- Enable RLS on timelapse_sessions if not already enabled
ALTER TABLE public.timelapse_sessions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to delete their own timelapse sessions
CREATE POLICY "Users can delete their own timelapse sessions"
ON public.timelapse_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Ensure users can view their own sessions (if not already exists)
-- This is just a safeguard, likely already exists if they can see them
CREATE POLICY "Users can view their own timelapse sessions"
ON public.timelapse_sessions
FOR SELECT
USING (auth.uid() = user_id);
