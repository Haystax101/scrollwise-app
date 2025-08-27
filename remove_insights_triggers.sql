-- Script to remove any incorrect triggers from the insights table
-- This should fix the "record 'new' has no field 'user_id'" error

BEGIN;

-- Remove all profile completion triggers from insights table (they shouldn't be there)
DROP TRIGGER IF EXISTS trigger_update_profile_completion_insights ON public.insights;
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON public.insights;

-- Remove any other profile-related triggers that might have been applied to insights by mistake
DROP TRIGGER IF EXISTS update_profile_completion_trigger ON public.insights;
DROP TRIGGER IF EXISTS profile_completion_trigger ON public.insights;

-- Log what we're doing
DO $$
BEGIN
  RAISE NOTICE 'Removed any profile completion triggers from insights table';
  RAISE NOTICE 'The insights table should only have count-related triggers, not profile triggers';
END $$;

COMMIT;

-- Verification: List all remaining triggers on insights table
SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name,
  t.tgenabled AS enabled,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'insights'
  AND t.tgisinternal = false;

-- Show what profile completion triggers still exist (should be on profile-related tables only)
SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname = 'update_profile_completion'
ORDER BY c.relname;