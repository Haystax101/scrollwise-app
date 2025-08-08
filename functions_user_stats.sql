-- Create a wrapper function to provide user stats in the expected shape
-- Safe to run multiple times
CREATE OR REPLACE FUNCTION public.get_user_stats(user_id_param uuid)
RETURNS TABLE (
  videos_watched int,
  posts_liked int,
  posts_saved int,
  days_active int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH likes AS (
    SELECT created_at::date AS day FROM article_likes WHERE user_id = user_id_param
    UNION ALL
    SELECT created_at::date FROM paper_likes WHERE user_id = user_id_param
    UNION ALL
    SELECT created_at::date FROM book_likes WHERE user_id = user_id_param
  ),
  saves AS (
    SELECT created_at::date FROM article_saves WHERE user_id = user_id_param
    UNION ALL
    SELECT created_at::date FROM paper_saves WHERE user_id = user_id_param
    UNION ALL
    SELECT created_at::date FROM book_saves WHERE user_id = user_id_param
  ),
  views AS (
    SELECT created_at::date FROM article_views WHERE user_id = user_id_param
    UNION ALL
    SELECT created_at::date FROM paper_views WHERE user_id = user_id_param
    UNION ALL
    SELECT created_at::date FROM book_views WHERE user_id = user_id_param
  ),
  activity_days AS (
    SELECT day FROM likes
    UNION
    SELECT day FROM saves
    UNION
    SELECT day FROM views
  ),
  agg AS (
    SELECT
      COALESCE((SELECT p.videos_watched FROM profiles p WHERE p.id = user_id_param), 0) AS videos_watched,
      COALESCE((SELECT COUNT(*) FROM likes), 0) AS posts_liked,
      COALESCE((SELECT COUNT(*) FROM saves), 0) AS posts_saved,
      COALESCE((SELECT COUNT(DISTINCT day) FROM activity_days), 0) AS days_active
  )
  SELECT * FROM agg;
END;
$$;

-- Optional: grant execute to common roles (adjust to your project's roles)
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid) TO anon, authenticated;