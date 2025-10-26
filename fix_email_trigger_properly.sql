-- Fix Email Octopus Trigger - Use Direct Auth Headers Instead of app.settings
-- This avoids the "unrecognized configuration parameter" error

-- Step 1: Drop the old broken trigger and function
DROP TRIGGER IF EXISTS on_profile_created_add_to_email_list ON public.profiles;
DROP FUNCTION IF EXISTS trigger_add_to_email_list();

-- Step 2: Create new trigger function with hardcoded/direct auth
-- IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY with your actual Supabase service role key
CREATE OR REPLACE FUNCTION trigger_add_to_email_list()
RETURNS TRIGGER AS $$
BEGIN
  -- Use pg_net to make async HTTP request (non-blocking)
  PERFORM net.http_post(
    url := 'https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/add-to-email-list',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZm10eWR2bmJvdWliZHVseWpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2NDc3MSwiZXhwIjoyMDY1MTQwNzcxfQ.ORZqf5Kg0-bRJljlUnRpdgJu8MVQU9Pkj8VjhzagDu4'  -- Replace with actual key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'profiles',
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'full_name', NEW.full_name
      )
    )
  );

  -- Always return NEW so the insert continues
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
CREATE TRIGGER on_profile_created_add_to_email_list
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_add_to_email_list();

-- Step 4: Verify setup
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname = 'on_profile_created_add_to_email_list';

-- Should show the trigger as enabled

--------------------------------------------------------------------------
-- ALTERNATIVE: Use Supabase Dashboard Webhooks (Even Easier - Recommended!)
--------------------------------------------------------------------------
-- Instead of SQL trigger, you can create a webhook in Supabase Dashboard:
-- 1. Go to Database → Webhooks
-- 2. Click "Create a new hook"
-- 3. Configure:
--    - Name: "Add to Email List"
--    - Table: profiles
--    - Events: INSERT
--    - Type: HTTP Request
--    - Method: POST
--    - URL: https://hefmtydvnbouibdulyjs.supabase.co/functions/v1/add-to-email-list
--    - Headers:
--        Authorization: Bearer YOUR_SERVICE_ROLE_KEY
--        Content-Type: application/json
-- 4. Save
--
-- This is easier and doesn't require SQL!
