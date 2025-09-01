-- This script corrects the syntax error in the get_leaderboard_for_user function.
-- The previous version used a reserved keyword ('current_user') as a CTE name,
-- which caused a syntax error. This version renames it to 'current_user_details'.

-- Drop the old function definition if it exists
DROP FUNCTION IF EXISTS public.get_leaderboard_for_user(p_user_id uuid);

-- Recreate the function with the corrected CTE name
CREATE OR REPLACE FUNCTION public.get_leaderboard_for_user(p_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  avatar_url text,
  total_voltz_earned integer,
  rank bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
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
  -- Corrected CTE name from 'current_user' to 'current_user_details'
  current_user_details AS (
    SELECT * FROM user_ranks WHERE user_ranks.user_id = p_user_id
  ),
  top_3 AS (
    SELECT * FROM user_ranks WHERE user_ranks.rank <= 3
  )
  -- Combine the top 3 users with the current user's details
  SELECT * FROM top_3
  UNION
  SELECT * FROM current_user_details
  ORDER BY rank;
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_leaderboard_for_user(p_user_id uuid) TO authenticated;

-- This corrected version should now execute without syntax errors.
