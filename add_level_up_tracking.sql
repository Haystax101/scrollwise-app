-- Add level-up tracking to profiles table
-- This provides a reliable way to detect when users have leveled up

-- 1. Add the is_levelled column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_levelled boolean DEFAULT false;

-- 2. Create or update the level update trigger function
DROP FUNCTION IF EXISTS update_user_level_and_track_levelup();

CREATE FUNCTION update_user_level_and_track_levelup()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_calculated_level integer;
    old_level integer;
BEGIN
    -- Calculate the new level based on total_voltz_earned
    new_calculated_level := calculate_level_from_voltz(NEW.total_voltz_earned);
    
    -- Get the old level (use existing level or calculate from old voltz)
    old_level := COALESCE(OLD.level, calculate_level_from_voltz(COALESCE(OLD.total_voltz_earned, 0)));
    
    -- Update the level
    NEW.level := new_calculated_level;
    
    -- Check if user leveled up
    IF new_calculated_level > old_level THEN
        -- User leveled up! Set the flag
        NEW.is_levelled := true;
        
        -- Log the level up for debugging
        RAISE NOTICE 'User % leveled up from % to % (voltz: % -> %)', 
            NEW.id, old_level, new_calculated_level, 
            COALESCE(OLD.total_voltz_earned, 0), NEW.total_voltz_earned;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. Drop existing trigger if it exists and create the new one
DROP TRIGGER IF EXISTS update_user_level_trigger ON profiles;

CREATE TRIGGER update_user_level_and_levelup_trigger
    BEFORE INSERT OR UPDATE OF total_voltz_earned ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_level_and_track_levelup();

-- 4. Create a function for the frontend to reset the is_levelled flag
DROP FUNCTION IF EXISTS reset_level_up_flag(uuid);

CREATE FUNCTION reset_level_up_flag(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE profiles 
    SET is_levelled = false 
    WHERE id = p_user_id;
END;
$$;

-- 5. Update the get_user_voltz_stats function to include is_levelled
DROP FUNCTION IF EXISTS get_user_voltz_stats(uuid);

CREATE FUNCTION get_user_voltz_stats(p_user_id uuid)
RETURNS TABLE (
    total_voltz_earned integer,
    spendable_voltz integer,
    level integer,
    level_progress numeric,
    voltz_to_next_level integer,
    voltz_for_current_level integer,
    voltz_for_next_level integer,
    is_levelled boolean
) 
LANGUAGE plpgsql
AS $$
DECLARE
    user_total_voltz integer := 0;
    user_spendable_voltz integer := 0;
    user_is_levelled boolean := false;
    current_level integer := 1;
    current_level_threshold integer := 0;
    next_level_threshold integer := 100;
    progress_percent numeric := 0;
    voltz_needed integer := 0;
BEGIN
    -- Get user's total voltz earned, spendable voltz, and level-up flag from profiles table
    SELECT 
        COALESCE(p.total_voltz_earned, 0),
        COALESCE(p.spendable_voltz, 0),
        COALESCE(p.is_levelled, false)
    INTO user_total_voltz, user_spendable_voltz, user_is_levelled
    FROM profiles p
    WHERE p.id = p_user_id;
    
    -- If user not found, return defaults
    IF user_total_voltz IS NULL THEN
        user_total_voltz := 0;
        user_spendable_voltz := 0;
        user_is_levelled := false;
    END IF;
    
    -- Calculate level based on NEW thresholds: 100, 300, 600, 1000, 1500, 2100, etc.
    IF user_total_voltz >= 2100 THEN
        -- For levels 7+ (2100+), use formula: 7 + (voltz - 2100) / 800
        current_level := 7 + FLOOR((user_total_voltz - 2100) / 800);
        current_level_threshold := 2100 + (current_level - 7) * 800;
        next_level_threshold := current_level_threshold + 800;
    ELSIF user_total_voltz >= 1500 THEN
        current_level := 6;
        current_level_threshold := 1500;
        next_level_threshold := 2100;
    ELSIF user_total_voltz >= 1000 THEN
        current_level := 5;
        current_level_threshold := 1000;
        next_level_threshold := 1500;
    ELSIF user_total_voltz >= 600 THEN
        current_level := 4;
        current_level_threshold := 600;
        next_level_threshold := 1000;
    ELSIF user_total_voltz >= 300 THEN
        current_level := 3;
        current_level_threshold := 300;
        next_level_threshold := 600;
    ELSIF user_total_voltz >= 100 THEN
        current_level := 2;
        current_level_threshold := 100;
        next_level_threshold := 300;
    ELSE
        current_level := 1;
        current_level_threshold := 0;
        next_level_threshold := 100;
    END IF;
    
    -- Calculate progress within current level
    voltz_needed := next_level_threshold - user_total_voltz;
    IF next_level_threshold > current_level_threshold THEN
        progress_percent := (user_total_voltz - current_level_threshold)::numeric / 
                           (next_level_threshold - current_level_threshold)::numeric * 100;
    ELSE
        progress_percent := 100;
    END IF;
    
    -- Ensure progress is between 0 and 100
    progress_percent := GREATEST(0, LEAST(100, progress_percent));
    
    RETURN QUERY SELECT 
        user_total_voltz,
        user_spendable_voltz,
        current_level,
        progress_percent,
        voltz_needed,
        current_level_threshold,
        next_level_threshold,
        user_is_levelled;
END;
$$;