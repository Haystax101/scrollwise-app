-- User Statistics Functions
-- This file contains SQL functions for calculating user learning statistics

-- Function to calculate the number of unique days a user has been active
-- (active = liked, saved, or viewed posts)
CREATE OR REPLACE FUNCTION get_user_active_days(user_id_param uuid)
RETURNS integer AS $$
DECLARE
  active_days integer;
BEGIN
  -- Get unique dates from all user activity tables
  SELECT COUNT(DISTINCT activity_date) INTO active_days
  FROM (
    -- Days with likes
    SELECT DATE(created_at) as activity_date
    FROM article_likes
    WHERE user_id = user_id_param
    
    UNION
    
    -- Days with saves
    SELECT DATE(created_at) as activity_date
    FROM article_saves
    WHERE user_id = user_id_param
    
    UNION
    
    -- Days with views
    SELECT DATE(created_at) as activity_date
    FROM article_views
    WHERE user_id = user_id_param
  ) AS all_activity;
  
  RETURN COALESCE(active_days, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive user stats in one call (optional optimization)
CREATE OR REPLACE FUNCTION get_user_learning_stats(user_id_param uuid)
RETURNS TABLE(
  videos_watched bigint,
  posts_liked bigint,
  posts_saved bigint,
  days_active integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM article_views WHERE user_id = user_id_param) as videos_watched,
    (SELECT COUNT(*) FROM article_likes WHERE user_id = user_id_param) as posts_liked,
    (SELECT COUNT(*) FROM article_saves WHERE user_id = user_id_param) as posts_saved,
    get_user_active_days(user_id_param) as days_active;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_active_days(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_learning_stats(uuid) TO authenticated; 