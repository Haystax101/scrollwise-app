-- Voltz-Based Level System
-- Unifies level progression with total_voltz_earned instead of separate XP system

-- Function to calculate level from total voltz earned
CREATE OR REPLACE FUNCTION public.calculate_level_from_voltz(total_voltz INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Progressive level system: each level requires more voltz
  -- Level 1: 0-19 voltz (20 voltz needed)
  -- Level 2: 20-59 voltz (40 more voltz needed) 
  -- Level 3: 60-119 voltz (60 more voltz needed)
  -- Formula: level_threshold = 20 * level * (level + 1) / 2
  -- Reverse: level = floor((-1 + sqrt(1 + 8 * total_voltz / 20)) / 2) + 1
  
  IF total_voltz < 0 THEN
    RETURN 1;
  END IF;
  
  -- Calculate level using quadratic formula
  RETURN GREATEST(1, FLOOR((-1.0 + SQRT(1.0 + 8.0 * total_voltz / 20.0)) / 2.0) + 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get voltz needed for next level
CREATE OR REPLACE FUNCTION public.get_voltz_for_level(target_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF target_level <= 1 THEN
    RETURN 0;
  END IF;
  
  -- Calculate total voltz needed for target level
  -- Formula: 20 * (level - 1) * level / 2
  RETURN 20 * (target_level - 1) * target_level / 2;
END;
$$ LANGUAGE plpgsql;

-- Function to update user level based on total voltz earned
CREATE OR REPLACE FUNCTION public.update_user_level_from_voltz()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
  old_level INTEGER;
BEGIN
  -- Get current level
  old_level := OLD.level;
  
  -- Calculate new level from total voltz earned
  new_level := public.calculate_level_from_voltz(NEW.total_voltz_earned);
  
  -- Update level if it changed
  IF new_level != old_level THEN
    NEW.level := new_level;
    
    -- Log level change (optional)
    RAISE NOTICE 'User % leveled % from % to % (% voltz)', 
      NEW.id, 
      CASE WHEN new_level > old_level THEN 'up' ELSE 'down' END,
      old_level, 
      new_level, 
      NEW.total_voltz_earned;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles table to update level when total_voltz_earned changes
DROP TRIGGER IF EXISTS update_level_from_voltz ON public.profiles;
CREATE TRIGGER update_level_from_voltz
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  WHEN (OLD.total_voltz_earned IS DISTINCT FROM NEW.total_voltz_earned)
  EXECUTE FUNCTION public.update_user_level_from_voltz();

-- Function to get comprehensive user voltz stats (replaces missing get_user_voltz_stats)
CREATE OR REPLACE FUNCTION public.get_user_voltz_stats(p_user_id UUID)
RETURNS TABLE(
  total_voltz_earned INTEGER,
  spendable_voltz INTEGER,
  level INTEGER,
  level_progress INTEGER,
  voltz_to_next_level INTEGER,
  voltz_for_current_level INTEGER,
  voltz_for_next_level INTEGER
) AS $$
DECLARE
  user_data RECORD;
  current_level_voltz INTEGER;
  next_level_voltz INTEGER;
BEGIN
  -- Get user data
  SELECT p.total_voltz_earned, p.spendable_voltz, p.level
  INTO user_data
  FROM public.profiles p
  WHERE p.id = p_user_id;
  
  -- If user not found, return defaults
  IF user_data IS NULL THEN
    total_voltz_earned := 0;
    spendable_voltz := 0;
    level := 1;
    level_progress := 0;
    voltz_to_next_level := 20;
    voltz_for_current_level := 0;
    voltz_for_next_level := 20;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Calculate level thresholds
  current_level_voltz := public.get_voltz_for_level(user_data.level);
  next_level_voltz := public.get_voltz_for_level(user_data.level + 1);
  
  -- Return stats
  total_voltz_earned := user_data.total_voltz_earned;
  spendable_voltz := user_data.spendable_voltz;
  level := user_data.level;
  level_progress := user_data.total_voltz_earned - current_level_voltz;
  voltz_to_next_level := next_level_voltz - user_data.total_voltz_earned;
  voltz_for_current_level := current_level_voltz;
  voltz_for_next_level := next_level_voltz;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Update existing levels to match voltz earned
UPDATE public.profiles 
SET level = public.calculate_level_from_voltz(total_voltz_earned)
WHERE total_voltz_earned > 0;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.calculate_level_from_voltz(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_voltz_for_level(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_voltz_stats(UUID) TO authenticated;