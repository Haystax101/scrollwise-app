-- NUCLEAR TRIGGER CLEANUP - Remove ALL triggers on insights table
-- Run this to completely clean slate the insights table triggers

-- Drop every possible trigger that could be on insights table
DROP TRIGGER IF EXISTS achievement_trigger_insights ON public.insights;
DROP TRIGGER IF EXISTS trigger_check_achievements ON public.insights;
DROP TRIGGER IF EXISTS profile_completion_trigger ON public.insights;
DROP TRIGGER IF EXISTS update_profile_completion_trigger ON public.insights;
DROP TRIGGER IF EXISTS trigger_update_profile_completion_insights ON public.insights;
DROP TRIGGER IF EXISTS social_voltz_trigger ON public.insights;
DROP TRIGGER IF EXISTS quiz_voltz_trigger ON public.insights;
DROP TRIGGER IF EXISTS update_profile_completion ON public.insights;
DROP TRIGGER IF EXISTS trigger_update_profile ON public.insights;
DROP TRIGGER IF EXISTS profile_trigger ON public.insights;
DROP TRIGGER IF EXISTS insight_supercharge_trigger ON public.insights;
DROP TRIGGER IF EXISTS voltz_trigger ON public.insights;
DROP TRIGGER IF EXISTS level_trigger ON public.insights;
DROP TRIGGER IF EXISTS xp_trigger ON public.insights;

-- Now systematically remove any remaining custom triggers
-- This approach doesn't use NOTICE so it will run silently
DO $$
DECLARE
  trigger_name text;
BEGIN
  FOR trigger_name IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'insights'
    AND t.tgname NOT LIKE 'RI_%'
    AND t.tgname NOT LIKE '%_not_null'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON public.insights';
  END LOOP;
END $$;

-- Verify cleanup worked by selecting remaining triggers
-- This should return only system triggers (RI_% and _not_null)
SELECT 
  t.tgname AS remaining_trigger,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'insights'
ORDER BY t.tgname;