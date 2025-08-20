-- Cleanup Redundant Database Fields
-- This migration should be run AFTER confirming the new Voltz system is working correctly
-- and all applications have been updated to use the new field names

-- WARNING: This is a destructive operation. Make sure to backup your data first!

BEGIN;

-- Step 1: Backup the old XP field data (optional safety measure)
-- You can uncomment this if you want to keep a backup
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_backup BIGINT;
-- UPDATE public.profiles SET xp_backup = xp WHERE xp_backup IS NULL;

-- Step 2: Remove redundant fields that are no longer used

-- Remove the old 'xp' field (now replaced by total_voltz_earned)
-- Uncomment when you're ready to remove it completely
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS xp;

-- Step 3: Clean up other potentially redundant fields
-- These fields might not be actively used - verify before uncommenting

-- Videos watched - if not being used, can be removed
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS videos_watched;

-- Minutes learned - if replaced by content_views tracking, can be removed  
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS minutes_learned;

-- Bio field - if not being displayed or used
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS bio;

-- Step 4: Update any indexes that might reference the old fields
-- Drop indexes on removed columns (uncomment as needed)
-- DROP INDEX IF EXISTS idx_profiles_xp;
-- DROP INDEX IF EXISTS idx_profiles_videos_watched;

-- Step 5: Add indexes for new fields if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_total_voltz_earned ON public.profiles(total_voltz_earned);
CREATE INDEX IF NOT EXISTS idx_profiles_spendable_voltz ON public.profiles(spendable_voltz);

-- Step 6: Remove the backward compatibility view once all apps are updated
-- DROP VIEW IF EXISTS public.profiles_with_xp;

-- Step 7: Update any remaining RLS policies
-- Make sure all policies reference the correct field names
-- (This should already be handled by the main migration, but double-check)

-- Step 8: Verify the cleanup
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND table_schema = 'public'
-- ORDER BY column_name;

COMMIT;

-- Post-cleanup verification queries (run these manually):
-- 
-- 1. Verify profile structure:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND table_schema = 'public'
-- ORDER BY ordinal_position;
--
-- 2. Check sample data:
-- SELECT id, full_name, total_voltz_earned, spendable_voltz, level 
-- FROM profiles 
-- LIMIT 5;
--
-- 3. Verify Voltz functions still work:
-- SELECT * FROM get_user_voltz_stats('your-user-id-here');

-- IMPORTANT NOTES:
-- 1. This script has most operations commented out for safety
-- 2. Uncomment operations only after verifying the new system works
-- 3. Always test on a staging environment first
-- 4. Make sure all client applications are updated before field removal
-- 5. Consider keeping backup fields for a grace period before final removal