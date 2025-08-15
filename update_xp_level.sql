-- Fix RLS policies and create proper XP function
-- This script addresses the RLS issues and creates the missing function

BEGIN;

-- First, create or update RLS policies for xp_ledger
DROP POLICY IF EXISTS "Users can insert their own XP records" ON public.xp_ledger;
DROP POLICY IF EXISTS "Users can view their own XP records" ON public.xp_ledger;

CREATE POLICY "Users can insert their own XP records" ON public.xp_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own XP records" ON public.xp_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Enable RLS on xp_ledger if not already enabled
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;

-- Function to update user XP and level
-- This function adds XP to a user and updates their level based on 20 XP per level
CREATE OR REPLACE FUNCTION public.update_user_xp_and_level(
  p_user_id uuid,
  p_xp_to_add integer
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_xp bigint;
  new_xp bigint;
  new_level integer;
  old_level integer;
  level_up boolean := false;
BEGIN
  -- Get current XP and level
  SELECT xp, level INTO current_xp, old_level 
  FROM public.profiles 
  WHERE id = p_user_id;
  
  IF current_xp IS NULL THEN
    current_xp := 0;
    old_level := 1;
  END IF;
  
  -- Calculate new XP and level
  new_xp := current_xp + p_xp_to_add;
  new_level := GREATEST(1, FLOOR(new_xp / 20) + 1);
  
  -- Check if user leveled up
  IF new_level > old_level THEN
    level_up := true;
  END IF;
  
  -- Update the profile
  UPDATE public.profiles 
  SET 
    xp = new_xp,
    level = new_level
  WHERE id = p_user_id;
  
  -- Return result with level up information
  RETURN json_build_object(
    'success', true,
    'new_xp', new_xp,
    'new_level', new_level,
    'old_level', old_level,
    'level_up', level_up
  );
END;$$;

GRANT EXECUTE ON FUNCTION public.update_user_xp_and_level(uuid, integer) TO authenticated;

COMMIT;