-- Migration: Private Profiles and Follow Requests

-- 1. Add is_private to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- 2. Add status to follows (accepted, pending)
ALTER TABLE public.follows 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted';

-- 3. Add image_url to insights if not exists (for photo insights)
ALTER TABLE public.insights 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_follows_status ON public.follows(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_private ON public.profiles(is_private);
