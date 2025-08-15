-- Function to update user XP and level
-- This function adds XP to a user and updates their level based on 20 XP per level

CREATE OR REPLACE FUNCTION public.update_user_xp_and_level(
  p_user_id uuid,
  p_xp_to_add integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_xp bigint;
  new_xp bigint;
  new_level integer;
BEGIN
  -- Get current XP
  SELECT xp INTO current_xp FROM public.profiles WHERE id = p_user_id;
  
  IF current_xp IS NULL THEN
    current_xp := 0;
  END IF;
  
  -- Calculate new XP and level
  new_xp := current_xp + p_xp_to_add;
  new_level := GREATEST(1, FLOOR(new_xp / 20) + 1);
  
  -- Update the profile
  UPDATE public.profiles 
  SET 
    xp = new_xp,
    level = new_level
  WHERE id = p_user_id;
END;$$;

GRANT EXECUTE ON FUNCTION public.update_user_xp_and_level(uuid, integer) TO authenticated;