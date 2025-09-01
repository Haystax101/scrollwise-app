-- This script creates a new `leaderboard` table and sets up a trigger
-- to keep it synchronized with the `profiles` table. This is necessary
-- to securely expose leaderboard data to all users without compromising
-- the security of the main `profiles` table.

-- 1. Create the leaderboard table
-- This table will store a denormalized copy of data needed for the leaderboard.
CREATE TABLE public.leaderboard (
  user_id uuid NOT NULL PRIMARY KEY,
  total_voltz_earned integer DEFAULT 0,
  full_name text,
  avatar_url text,
  CONSTRAINT leaderboard_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 2. Enable Row Level Security for the new table
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow all authenticated users to read the leaderboard
-- This policy grants read-only access to everyone who is logged in.
CREATE POLICY "Allow read access to all authenticated users"
ON public.leaderboard
FOR SELECT
TO authenticated
USING (true);

-- 4. Create a function to sync data from profiles to leaderboard
-- This function will be triggered whenever a user's profile is inserted or updated.
CREATE OR REPLACE FUNCTION public.sync_profile_to_leaderboard()
RETURNS TRIGGER
LANGUAGE plpgsql
-- SECURITY DEFINER is crucial for allowing this function to bypass RLS on the leaderboard table.
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.leaderboard (user_id, total_voltz_earned, full_name, avatar_url)
  VALUES (NEW.id, NEW.total_voltz_earned, NEW.full_name, NEW.avatar_url)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_voltz_earned = EXCLUDED.total_voltz_earned,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$;

-- 5. Create a trigger on the profiles table
-- This trigger fires the sync function when relevant fields in the profiles table change.
CREATE TRIGGER on_profile_change_update_leaderboard
AFTER INSERT OR UPDATE OF total_voltz_earned, full_name, avatar_url ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_leaderboard();

-- 6. Initial Data Population
-- This command should be run once manually after creating the table and trigger
-- to populate the leaderboard with existing users.
INSERT INTO public.leaderboard (user_id, total_voltz_earned, full_name, avatar_url)
SELECT id, total_voltz_earned, full_name, avatar_url
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 7. Grant permissions to authenticated role
GRANT SELECT ON public.leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_profile_to_leaderboard() TO authenticated;


-- After running this in the Supabase SQL Editor, your leaderboard is ready to be used.
-- Remember to run the initial data population query (step 6).
