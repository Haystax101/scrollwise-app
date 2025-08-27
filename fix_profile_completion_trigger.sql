-- Fix for the profile completion trigger to handle different user ID field names
-- This should resolve the "record 'new' has no field 'user_id'" error

BEGIN;

-- Update the profile completion function to handle both user_id and author_id fields
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS trigger AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Determine the user ID based on the table structure
  CASE 
    WHEN TG_TABLE_NAME = 'profiles' THEN
      target_user_id := NEW.id;
    WHEN TG_TABLE_NAME = 'insights' THEN
      -- Insights table uses author_id, not user_id
      target_user_id := NEW.author_id;
    ELSE
      -- Check if the table has user_id field
      IF TG_TABLE_NAME IN ('user_education', 'user_experiences', 'user_goals', 'user_industries', 'user_projects', 'profile_sections', 'user_achievements') THEN
        target_user_id := NEW.user_id;
      ELSE
        -- For unknown tables, skip the update
        RAISE NOTICE 'Profile completion trigger called on unsupported table: %', TG_TABLE_NAME;
        RETURN NEW;
      END IF;
  END CASE;
  
  -- Only proceed if we have a valid user ID
  IF target_user_id IS NOT NULL THEN
    UPDATE profiles 
    SET profile_completion_percentage = calculate_profile_completion(target_user_id)
    WHERE id = target_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove any incorrectly applied triggers from the insights table
-- The insights table should NOT affect profile completion percentage
DROP TRIGGER IF EXISTS trigger_update_profile_completion_insights ON public.insights;

-- Ensure the trigger is not applied to insights table by mistake
-- (This is a safeguard - the trigger shouldn't exist on insights anyway)

COMMIT;

-- Verification query to check which tables have the profile completion trigger
SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname = 'update_profile_completion'
ORDER BY c.relname;