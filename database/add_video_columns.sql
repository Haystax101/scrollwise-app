-- Add video_url and status columns to timelapse_sessions table
ALTER TABLE public.timelapse_sessions 
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'processing'; -- 'processing', 'completed', 'failed'

-- Update existing rows to have a status if needed (optional)
UPDATE public.timelapse_sessions 
SET status = 'completed' 
WHERE video_url IS NOT NULL;
