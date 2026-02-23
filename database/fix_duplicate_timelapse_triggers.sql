-- Fix Duplicate Triggers on Timelapses
-- We found that likes and comments have TWO triggers each, causing counts to double.
-- 1. trigger_update_timelapse_likes (from social_features_timelapses.sql)
-- 2. on_timelapse_like_added (from fix_timelapse_fks_and_triggers.sql)
-- We will remove the older ones and keep the newer ones (on_timelapse_...)
-- We will also recalculate all counts to fix the data corruption.

BEGIN;

-- 1. Drop Duplicate LIKE Triggers
DROP TRIGGER IF EXISTS trigger_update_timelapse_likes ON public.timelapse_likes;
DROP FUNCTION IF EXISTS public.update_timelapse_likes_count();

-- 2. Drop Duplicate COMMENT Triggers
DROP TRIGGER IF EXISTS trigger_update_timelapse_comments ON public.timelapse_comments;
DROP FUNCTION IF EXISTS public.update_timelapse_comments_count();

-- Note: Saves only had a single trigger (trigger_update_timelapse_saves), so we leave it alone.

-- 3. Recalculate Counts for ALL Timelapses
-- This fixes the "Magic 8 Likes" (actually 4 likes * 2 triggers) issue.

-- Reset and Recalculate Likes
UPDATE public.timelapse_sessions
SET likes_count = (
    SELECT count(*)
    FROM public.timelapse_likes
    WHERE timelapse_likes.timelapse_id = timelapse_sessions.id
);

-- Reset and Recalculate Comments
UPDATE public.timelapse_sessions
SET comments_count = (
    SELECT count(*)
    FROM public.timelapse_comments
    WHERE timelapse_comments.timelapse_id = timelapse_sessions.id
);

-- Reset and Recalculate Saves
UPDATE public.timelapse_sessions
SET saves_count = (
    SELECT count(*)
    FROM public.timelapse_saves
    WHERE timelapse_saves.timelapse_id = timelapse_sessions.id
);

COMMIT;
