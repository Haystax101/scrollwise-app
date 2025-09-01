-- Fix Level System - Ensure Level Updates When Voltz Changes
-- This ensures that when users earn 50 voltz, they properly level up to Level 2

-- 1. First, ensure the level calculation function exists and is correct
CREATE OR REPLACE FUNCTION public.calculate_level_from_voltz(total_voltz INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Progressive level system: each level requires more voltz
  -- Level 1: 0-19 voltz (20 voltz needed to reach Level 2)
  -- Level 2: 20-59 voltz (40 more voltz needed to reach Level 3)
  -- Level 3: 60-119 voltz (60 more voltz needed to reach Level 4)
  -- Formula: level_threshold = 20 * level * (level + 1) / 2
  -- Reverse: level = floor((-1 + sqrt(1 + 8 * total_voltz / 20)) / 2) + 1
  
  IF total_voltz < 0 THEN
    RETURN 1;
  END IF;
  
  -- Calculate level using quadratic formula
  -- For 50 voltz: floor((-1 + sqrt(1 + 8 * 50 / 20)) / 2) + 1 = floor((-1 + sqrt(21)) / 2) + 1 = 3
  RETURN GREATEST(1, FLOOR((-1.0 + SQRT(1.0 + 8.0 * total_voltz / 20.0)) / 2.0) + 1);
END;
$$ LANGUAGE plpgsql;

-- 2. Function to get voltz needed for specific level
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

-- 3. Critical: Function to update user level when total_voltz_earned changes
CREATE OR REPLACE FUNCTION public.update_user_level_from_voltz()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
  old_level INTEGER;
BEGIN
  -- Get current level (use 1 if null for safety)
  old_level := COALESCE(OLD.level, 1);
  
  -- Calculate new level from total voltz earned
  new_level := public.calculate_level_from_voltz(NEW.total_voltz_earned);
  
  -- Update level if it changed
  IF new_level != old_level THEN
    NEW.level := new_level;
    
    -- Log level change for debugging
    RAISE NOTICE 'User % leveled % from % to % (% total voltz)', 
      NEW.id, 
      CASE WHEN new_level > old_level THEN 'UP' ELSE 'DOWN' END,
      old_level, 
      new_level, 
      NEW.total_voltz_earned;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure the trigger exists and is active
DROP TRIGGER IF EXISTS update_level_from_voltz ON public.profiles;
CREATE TRIGGER update_level_from_voltz
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  WHEN (OLD.total_voltz_earned IS DISTINCT FROM NEW.total_voltz_earned)
  EXECUTE FUNCTION public.update_user_level_from_voltz();

-- 5. Function to get comprehensive voltz stats (needed by voltzService)
CREATE OR REPLACE FUNCTION public.get_user_voltz_stats(p_user_id UUID)
RETURNS TABLE(
  total_voltz_earned INTEGER,
  spendable_voltz INTEGER,
  level INTEGER,
  level_progress NUMERIC,
  voltz_to_next_level INTEGER,
  voltz_for_current_level INTEGER,
  voltz_for_next_level INTEGER
) AS $$
DECLARE
  user_data RECORD;
  current_level INTEGER;
  next_level INTEGER;
  voltz_for_current INTEGER;
  voltz_for_next INTEGER;
  progress_in_level NUMERIC;
BEGIN
  -- Get user's current voltz data
  SELECT p.total_voltz_earned, p.spendable_voltz, p.level
  INTO user_data
  FROM public.profiles p
  WHERE p.id = p_user_id;
  
  IF NOT FOUND THEN
    -- Return defaults for non-existent user
    RETURN QUERY SELECT 0, 0, 1, 0.0::NUMERIC, 20, 0, 20;
    RETURN;
  END IF;
  
  -- Calculate level from voltz (ensure consistency)
  current_level := public.calculate_level_from_voltz(user_data.total_voltz_earned);
  next_level := current_level + 1;
  
  -- Get voltz thresholds
  voltz_for_current := public.get_voltz_for_level(current_level);
  voltz_for_next := public.get_voltz_for_level(next_level);
  
  -- Calculate progress within current level
  IF voltz_for_next > voltz_for_current THEN
    progress_in_level := LEAST(1.0, 
      (user_data.total_voltz_earned - voltz_for_current)::NUMERIC / 
      (voltz_for_next - voltz_for_current)::NUMERIC
    );
  ELSE
    progress_in_level := 1.0;
  END IF;
  
  -- Return all stats
  RETURN QUERY SELECT 
    user_data.total_voltz_earned,
    user_data.spendable_voltz,
    current_level,
    progress_in_level,
    GREATEST(0, voltz_for_next - user_data.total_voltz_earned),
    voltz_for_current,
    voltz_for_next;
END;
$$ LANGUAGE plpgsql;

-- 6. Fix any users whose level is incorrect based on their voltz
-- This will immediately fix the user who earned 50 voltz but is still Level 1
UPDATE public.profiles 
SET level = public.calculate_level_from_voltz(total_voltz_earned)
WHERE level != public.calculate_level_from_voltz(total_voltz_earned);

-- Test the functions
DO $$
BEGIN
  RAISE NOTICE 'Level for 0 voltz: %', public.calculate_level_from_voltz(0);
  RAISE NOTICE 'Level for 20 voltz: %', public.calculate_level_from_voltz(20);
  RAISE NOTICE 'Level for 50 voltz: %', public.calculate_level_from_voltz(50);
  RAISE NOTICE 'Level for 60 voltz: %', public.calculate_level_from_voltz(60);
  RAISE NOTICE 'Voltz needed for Level 1: %', public.get_voltz_for_level(1);
  RAISE NOTICE 'Voltz needed for Level 2: %', public.get_voltz_for_level(2);
  RAISE NOTICE 'Voltz needed for Level 3: %', public.get_voltz_for_level(3);
END $$;