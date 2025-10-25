-- Migration: Add webhook to trigger Email Octopus integration on user signup
-- This webhook triggers when a new profile is created (which happens after auth.users signup)

-- Create the webhook trigger function
CREATE OR REPLACE FUNCTION trigger_add_to_email_list()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function via pg_net extension
  -- Note: You'll need to configure this with your actual Supabase project URL
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/add-to-email-list',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'profiles',
        'record', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'full_name', NEW.full_name
        ),
        'old_record', null
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on profiles table
-- This fires AFTER a new profile is inserted
DROP TRIGGER IF EXISTS on_profile_created_add_to_email_list ON public.profiles;

CREATE TRIGGER on_profile_created_add_to_email_list
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_add_to_email_list();

-- Add comment for documentation
COMMENT ON FUNCTION trigger_add_to_email_list() IS
  'Triggers Email Octopus integration when a new user profile is created. Calls the add-to-email-list edge function.';
