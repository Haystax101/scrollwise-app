-- Fix duplicate daily activity handling
-- This prevents the duplicate key constraint errors

DROP FUNCTION IF EXISTS log_daily_activity(UUID, TEXT[], DATE);
CREATE FUNCTION log_daily_activity(
  user_id_param UUID,
  activity_types_param TEXT[] DEFAULT ARRAY['app_open'],
  activity_date_param DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
BEGIN
  IF user_id_param IS NULL THEN
    RAISE WARNING 'log_daily_activity: user_id_param is NULL';
    RETURN FALSE;
  END IF;

  -- Use INSERT ... ON CONFLICT to handle duplicates gracefully
  INSERT INTO user_daily_activities (
    user_id, activity_date, activity_types, total_minutes_active,
    unique_content_pieces, interactions_count
  ) VALUES (
    user_id_param, activity_date_param, activity_types_param, 1,
    CASE WHEN 'content_view' = ANY(activity_types_param) THEN 1 ELSE 0 END, 1
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    activity_types = array_cat(user_daily_activities.activity_types, activity_types_param),
    total_minutes_active = user_daily_activities.total_minutes_active + 1,
    interactions_count = user_daily_activities.interactions_count + 1,
    unique_content_pieces = user_daily_activities.unique_content_pieces +
      CASE WHEN 'content_view' = ANY(activity_types_param) THEN 1 ELSE 0 END,
    updated_at = NOW();

  -- Ensure user has a streak record (initialize if missing)
  IF NOT EXISTS (
    SELECT 1 FROM user_streaks
    WHERE user_id = user_id_param AND streak_type = 'daily_learning' AND is_active = true
  ) THEN
    PERFORM setup_user_learning_streak(user_id_param, 30);
  END IF;

  -- Update streak
  PERFORM update_user_streak(user_id_param, activity_date_param);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

SELECT
  '✅ DUPLICATE ACTIVITY HANDLING FIXED!' as status,
  'No more duplicate key constraint errors' as result;