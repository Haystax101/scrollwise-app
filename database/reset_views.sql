-- Reset Public View Counts to 0
UPDATE public.timelapse_sessions SET views_count = 0;
UPDATE public.insights SET views_count = 0;
UPDATE public.community_posts SET views_count = 0;

-- Optional: If you want to clear personal tracking history too (so everyone is "new" again)
-- DELETE FROM public.content_views;
