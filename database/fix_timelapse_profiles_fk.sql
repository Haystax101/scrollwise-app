-- Fix Timelapse Sessions FK to point to Profiles instead of Auth.Users
-- This allows PostgREST / Supabase to automatically resolve the 'profiles' join.

ALTER TABLE public.timelapse_sessions
DROP CONSTRAINT IF EXISTS timelapse_sessions_user_id_fkey;

ALTER TABLE public.timelapse_sessions
ADD CONSTRAINT timelapse_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
