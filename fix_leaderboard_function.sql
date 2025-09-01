-- This script corrects the definition of the get_leaderboard_for_user function
-- to ensure it is stable and securely exposed to the Supabase API.

-- Drop the old function definition if it exists
DROP FUNCTION IF EXISTS public.get_leaderboard_for_user(p_user_id uuid);

-- Recreate the function with SECURITY DEFINER and a stable search_path
CREATE OR REPLACE FUNCTION public.get_leaderboard_for_user(p_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  avatar_url text,
  total_voltz_earned integer,
  rank bigint
)
LANGUAGE plpgsql
-- Use SECURITY DEFINER to run the function with the permissions of the owner.
-- This is a more secure and reliable way to bypass RLS for a specific query.
SECURITY DEFINER
-- Set a stable search path to prevent potential hijacking.
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_ranks AS (
    SELECT
      l.user_id,
      l.full_name,
      l.avatar_url,
      l.total_voltz_earned,
      DENSE_RANK() OVER (ORDER BY l.total_voltz_earned DESC) as rank
    FROM
      public.leaderboard l
  ),
  current_user AS (
    SELECT * FROM user_ranks WHERE user_ranks.user_id = p_user_id
  ),
  top_3 AS (
    SELECT * FROM user_ranks WHERE user_ranks.rank <= 3
  )
  SELECT * FROM top_3
  UNION
  SELECT * FROM current_user
  ORDER BY rank;
END;
$$;

-- Grant execute permission to the authenticated role so it can be called from the app
GRANT EXECUTE ON FUNCTION public.get_leaderboard_for_user(p_user_id uuid) TO authenticated;

-- After running this, the function should be correctly exposed via the API.
