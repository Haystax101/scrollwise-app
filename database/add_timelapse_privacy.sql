-- Add Privacy Level to Timelapse Sessions
-- Values: 'public' (everyone), 'friends' (mutual follows), 'private' (only me)
ALTER TABLE public.timelapse_sessions 
ADD COLUMN IF NOT EXISTS privacy_level text DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private'));

-- Index for faster filtering in feed
CREATE INDEX IF NOT EXISTS idx_timelapse_privacy ON public.timelapse_sessions(privacy_level);
