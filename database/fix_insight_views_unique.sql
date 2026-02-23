-- Fix for High View Counts
-- This ensures that a user is only counted once per insight.
-- Run this in the Supabase SQL Editor.

-- 1. Clean up duplicate views (keeping the earliest view)
-- Optimized to prevent timeouts on large datasets
DELETE FROM public.insight_views
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id, insight_id ORDER BY created_at ASC) as rn
    FROM public.insight_views
  ) t
  WHERE rn > 1
);

-- 2. Add Unique Constraint to prevent future duplicates
ALTER TABLE public.insight_views 
ADD CONSTRAINT insight_views_user_id_insight_id_key UNIQUE (user_id, insight_id);

-- 3. Recalculate counts to match reality
UPDATE public.insights i
SET views_count = (
    SELECT count(*) 
    FROM public.insight_views v 
    WHERE v.insight_id = i.id
);
