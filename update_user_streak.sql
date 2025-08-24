-- Function to update user streak based on daily learning activity
-- This should be called whenever a user performs a learning activity (view, like, save, comment)

CREATE OR REPLACE FUNCTION update_user_streak(
  user_id_param UUID,
  activity_date_param DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  streak_updated BOOLEAN
) AS $$
DECLARE
  existing_streak RECORD;
  days_since_last_activity INTEGER;
  new_current_streak INTEGER;
  new_longest_streak INTEGER;
  streak_was_updated BOOLEAN := FALSE;
BEGIN
  -- Get existing streak record or create default values
  SELECT 
    us.current_streak,
    us.longest_streak,
    us.last_activity_date,
    us.target_days
  INTO existing_streak
  FROM user_streaks us
  WHERE us.user_id = user_id_param 
    AND us.streak_type = 'daily_learning'
    AND us.is_active = TRUE
  LIMIT 1;

  -- If no streak record exists, create one
  IF existing_streak IS NULL THEN
    INSERT INTO user_streaks (
      user_id,
      streak_type,
      target_days,
      current_streak,
      longest_streak,
      last_activity_date,
      is_active
    ) VALUES (
      user_id_param,
      'daily_learning',
      7, -- Default target of 7 days
      1, -- First activity starts streak at 1 (minimum)
      1,
      activity_date_param,
      TRUE
    );
    
    new_current_streak := 1;
    new_longest_streak := 1;
    streak_was_updated := TRUE;
  ELSE
    -- Calculate days since last activity
    days_since_last_activity := activity_date_param - existing_streak.last_activity_date;
    
    -- If activity is on the same date, no change needed
    IF days_since_last_activity = 0 THEN
      new_current_streak := existing_streak.current_streak;
      new_longest_streak := existing_streak.longest_streak;
      streak_was_updated := FALSE;
    
    -- If activity is consecutive (next day), increment streak
    ELSIF days_since_last_activity = 1 THEN
      new_current_streak := existing_streak.current_streak + 1;
      new_longest_streak := GREATEST(existing_streak.longest_streak, new_current_streak);
      streak_was_updated := TRUE;
      
      -- Update the existing record
      UPDATE user_streaks 
      SET 
        current_streak = new_current_streak,
        longest_streak = new_longest_streak,
        last_activity_date = activity_date_param,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = user_id_param 
        AND streak_type = 'daily_learning' 
        AND is_active = TRUE;
    
    -- If gap is more than 1 day, reset streak to 1 (minimum streak value)
    ELSE
      new_current_streak := 1; -- Reset to 1, never 0
      new_longest_streak := existing_streak.longest_streak; -- Keep existing longest
      streak_was_updated := TRUE;
      
      -- Update the existing record
      UPDATE user_streaks 
      SET 
        current_streak = new_current_streak,
        longest_streak = new_longest_streak,
        last_activity_date = activity_date_param,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = user_id_param 
        AND streak_type = 'daily_learning' 
        AND is_active = TRUE;
    END IF;
  END IF;

  -- Also update the days_streak field in profiles table for backward compatibility
  UPDATE profiles 
  SET days_streak = new_current_streak
  WHERE id = user_id_param;

  -- Return the results
  RETURN QUERY SELECT 
    new_current_streak,
    new_longest_streak,
    streak_was_updated;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM update_user_streak('user-uuid-here'::UUID);
-- SELECT * FROM update_user_streak('user-uuid-here'::UUID, '2024-08-24'::DATE);