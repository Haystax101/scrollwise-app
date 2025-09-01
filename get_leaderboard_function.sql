-- This script creates a PostgreSQL function that can be called from the frontend
-- using Supabase's RPC feature. It efficiently fetches the leaderboard data
-- required by the LeaderboardCard component.

-- Drop the function if it already exists to allow for easy updates.
DROP FUNCTION IF EXISTS get_leaderboard_for_user(p_user_id uuid);

CREATE OR REPLACE FUNCTION get_leaderboard_for_user(p_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  avatar_url text,
  total_voltz_earned integer,
  rank bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function calculates the rank for all users and returns the data
  -- needed for the leaderboard display logic.
  RETURN QUERY
  WITH user_ranks AS (
    SELECT
      l.user_id,
      l.full_name,
      l.avatar_url,
      l.total_voltz_earned,
      -- Use a window function to calculate rank based on voltz, descending.
      -- Users with the same voltz will have the same rank (dense_rank).
      DENSE_RANK() OVER (ORDER BY l.total_voltz_earned DESC) as rank
    FROM
      public.leaderboard l
  ),
  -- Find the current user's rank
  current_user AS (
    SELECT * FROM user_ranks WHERE user_id = p_user_id
  ),
  -- Get the top 3 users
  top_3 AS (
    SELECT * FROM user_ranks WHERE rank <= 3
  )
  -- Combine the results
  SELECT * FROM top_3
  UNION
  SELECT * FROM current_user
  ORDER BY rank;
END;
$$;

-- Grant execute permission to the authenticated role so it can be called from the app
GRANT EXECUTE ON FUNCTION get_leaderboard_for_user(p_user_id uuid) TO authenticated;
