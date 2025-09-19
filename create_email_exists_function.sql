-- Create a secure function to check if email exists in profiles table
-- This function runs with SECURITY DEFINER to bypass RLS
-- It only returns a boolean, not any actual profile data

CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    email_count integer;
BEGIN
    -- Count profiles with the given email
    SELECT COUNT(*)
    INTO email_count
    FROM public.profiles
    WHERE email = email_to_check;

    -- Return true if email exists, false otherwise
    RETURN email_count > 0;
END;
$$;

-- Grant execute permission to anonymous users (for signup validation)
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon;

-- Grant execute permission to authenticated users as well
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO authenticated;

-- Add a comment explaining the function's purpose
COMMENT ON FUNCTION public.check_email_exists(text) IS
'Safely check if an email exists in the profiles table. Used for signup validation. Returns boolean only, no profile data exposed.';