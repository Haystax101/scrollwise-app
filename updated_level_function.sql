-- Updated level calculation function with new thresholds
-- New level requirements: 100, 300, 600, 1000, 1500, 2100, etc.

CREATE OR REPLACE FUNCTION get_user_voltz_stats(p_user_id uuid)
RETURNS TABLE (
    total_voltz_earned integer,
    spendable_voltz integer,
    level integer,
    level_progress numeric,
    voltz_to_next_level integer,
    voltz_for_current_level integer,
    voltz_for_next_level integer
) 
LANGUAGE plpgsql
AS $$
DECLARE
    user_total_voltz integer := 0;
    user_spendable_voltz integer := 0;
    current_level integer := 1;
    current_level_threshold integer := 0;
    next_level_threshold integer := 100;
    progress_percent numeric := 0;
    voltz_needed integer := 0;
BEGIN
    -- Get user's total voltz earned and spendable voltz
    SELECT 
        COALESCE(total_voltz_earned, 0),
        COALESCE(spendable_voltz, 0)
    INTO user_total_voltz, user_spendable_voltz
    FROM profiles 
    WHERE id = p_user_id;
    
    -- If user not found, return defaults
    IF user_total_voltz IS NULL THEN
        user_total_voltz := 0;
        user_spendable_voltz := 0;
    END IF;
    
    -- Calculate level based on new thresholds
    -- Level thresholds: 0->100, 100->300, 300->600, 600->1000, 1000->1500, 1500->2100, etc.
    IF user_total_voltz >= 2100 THEN
        -- For levels 7+ (2100+), use formula: 2100 + (level-7) * 800
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
        next_level_threshold;
END;
$$;

-- Also create a helper function to get level from voltz amount
CREATE OR REPLACE FUNCTION calculate_level_from_voltz(voltz_amount integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
    -- New level thresholds: 100, 300, 600, 1000, 1500, 2100, etc.
    IF voltz_amount >= 2100 THEN
        -- For levels 7+ (2100+), use formula: 7 + (voltz - 2100) / 800
        RETURN 7 + FLOOR((voltz_amount - 2100) / 800);
    ELSIF voltz_amount >= 1500 THEN
        RETURN 6;
    ELSIF voltz_amount >= 1000 THEN
        RETURN 5;
    ELSIF voltz_amount >= 600 THEN
        RETURN 4;
    ELSIF voltz_amount >= 300 THEN
        RETURN 3;
    ELSIF voltz_amount >= 100 THEN
        RETURN 2;
    ELSE
        RETURN 1;
    END IF;
END;
$$;

-- Update the profiles table to use the new level calculation
-- This trigger will automatically update the level when total_voltz_earned changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.level := calculate_level_from_voltz(NEW.total_voltz_earned);
    RETURN NEW;
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS update_user_level_trigger ON profiles;
CREATE TRIGGER update_user_level_trigger
    BEFORE INSERT OR UPDATE OF total_voltz_earned ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_level();