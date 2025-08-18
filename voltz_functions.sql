-- Voltz/XP management functions for supercharging insights
-- This handles both spendable voltz and total XP accumulation for leveling
-- When you earn voltz/XP, it goes to BOTH spendable pool AND total XP pool
-- When you spend voltz, only the spendable pool decreases (total XP remains for leveling)

BEGIN;

-- Drop existing functions to avoid overloading conflicts
DROP FUNCTION IF EXISTS public.spend_voltz(uuid, integer, bigint, text);
DROP FUNCTION IF EXISTS public.spend_voltz(uuid, integer, text, text);
DROP FUNCTION IF EXISTS public.earn_voltz_xp(uuid, integer, text, bigint, uuid);
DROP FUNCTION IF EXISTS public.earn_voltz_xp(uuid, integer, text, text, uuid);
DROP FUNCTION IF EXISTS public.earn_voltz(uuid, integer, text, bigint);
DROP FUNCTION IF EXISTS public.get_voltz_balance(uuid);
DROP FUNCTION IF EXISTS public.get_spendable_voltz(uuid);
DROP FUNCTION IF EXISTS public.get_total_xp(uuid);
DROP FUNCTION IF EXISTS public.grant_xp_for_insight_interaction(bigint, uuid, uuid, text);


-- Function to spend voltz atomically (only reduces spendable voltz, not total XP)
CREATE OR REPLACE FUNCTION public.spend_voltz(
  p_user_id uuid,
  p_amount integer,
  p_insight_id uuid,
  p_reason text DEFAULT 'insight_supercharge'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_spendable integer;
BEGIN
  -- Get current spendable voltz balance with row lock
  SELECT COALESCE(spendable_voltz, 0) INTO current_spendable
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user has enough spendable voltz
  IF current_spendable < p_amount THEN
    RAISE EXCEPTION 'Insufficient spendable voltz. Current: %, Required: %', current_spendable, p_amount;
  END IF;
  
  -- Deduct voltz from spendable balance only (xp remains unchanged)
  UPDATE public.profiles
  SET spendable_voltz = spendable_voltz - p_amount
  WHERE id = p_user_id;
  
  -- Record the transaction in XP ledger (existing system)
  INSERT INTO public.xp_ledger (
    user_id,
    amount,
    reason,
    subject_type,
    subject_id,
    actor_id,
    transaction_type
  ) VALUES (
    p_user_id,
    -p_amount, -- Negative amount for spending
    p_reason,
    'insight',
    p_insight_id::text,
    p_user_id,
    'spent'
  );
  
  -- Update the insight with supercharge info
  UPDATE public.insights
  SET 
    supercharged = true,
    voltz_spent = p_amount
  WHERE id = p_insight_id AND author_id = p_user_id;
  
END;$$;

-- Function to earn voltz/XP (adds to BOTH spendable voltz AND total XP for leveling)
CREATE OR REPLACE FUNCTION public.earn_voltz_xp(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_insight_id uuid DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add to both spendable voltz AND existing XP field
  UPDATE public.profiles
  SET 
    spendable_voltz = COALESCE(spendable_voltz, 0) + p_amount,
    xp = COALESCE(xp, 0) + p_amount
  WHERE id = p_user_id;
  
  -- Record the transaction in XP ledger (existing system)
  INSERT INTO public.xp_ledger (
    user_id,
    amount,
    reason,
    subject_type,
    subject_id,
    actor_id,
    transaction_type
  ) VALUES (
    p_user_id,
    p_amount,
    p_reason,
    CASE WHEN p_insight_id IS NOT NULL THEN 'insight' ELSE 'general' END,
    COALESCE(p_insight_id::text, 'system'),
    COALESCE(p_actor_id, p_user_id),
    'earned'
  );
  
  -- Update user level based on new total XP
  PERFORM public.update_user_xp_and_level(p_user_id, p_amount);
END;$$;

-- Function to get user's spendable voltz balance
CREATE OR REPLACE FUNCTION public.get_spendable_voltz(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  balance integer;
BEGIN
  SELECT COALESCE(spendable_voltz, 0) INTO balance
  FROM public.profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(balance, 0);
END;$$;

-- Function to get user's total XP (for level calculation) - uses existing xp field
CREATE OR REPLACE FUNCTION public.get_total_xp(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total integer;
BEGIN
  SELECT COALESCE(xp, 0) INTO total
  FROM public.profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(total, 0);
END;$$;

-- Enhanced function to award XP for insight interactions (replaces existing)
CREATE OR REPLACE FUNCTION public.grant_xp_for_insight_interaction(
  p_insight_id uuid,
  p_author_id uuid,
  p_actor_id uuid,
  p_reason text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  xp_amount integer;
BEGIN
  -- Only grant XP if actor is not the author
  IF p_author_id = p_actor_id THEN
    RETURN;
  END IF;

  -- Determine XP amount based on interaction type
  xp_amount := CASE 
    WHEN p_reason = 'insight_like' THEN 2
    WHEN p_reason = 'insight_save' THEN 3
    WHEN p_reason = 'insight_comment' THEN 5
    ELSE 1
  END;

  -- Use the new earn function that updates both pools
  PERFORM public.earn_voltz_xp(
    p_author_id, 
    xp_amount, 
    p_reason, 
    p_insight_id,
    p_actor_id
  );
END;$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.spend_voltz(uuid, integer, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.earn_voltz_xp(uuid, integer, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_spendable_voltz(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_xp(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_xp_for_insight_interaction(uuid, uuid, uuid, text) TO authenticated;

-- Add transaction_type to xp_ledger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'xp_ledger' AND column_name = 'transaction_type') THEN
    ALTER TABLE public.xp_ledger ADD COLUMN transaction_type text CHECK (transaction_type IN ('earned', 'spent')) DEFAULT 'earned';
  END IF;
END $$;

-- Add spendable_voltz column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'spendable_voltz') THEN
    ALTER TABLE public.profiles ADD COLUMN spendable_voltz integer DEFAULT 100;
  END IF;
END $$;

-- Initialize spendable_voltz for existing users based on current XP (one-time migration)
UPDATE public.profiles 
SET spendable_voltz = COALESCE(xp, 100) 
WHERE spendable_voltz IS NULL;

-- Add supercharge columns to insights table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insights' AND column_name = 'supercharged') THEN
    ALTER TABLE public.insights ADD COLUMN supercharged boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insights' AND column_name = 'voltz_spent') THEN
    ALTER TABLE public.insights ADD COLUMN voltz_spent integer DEFAULT 0;
  END IF;
END $$;

-- Remove any old voltz_balance or total_xp columns if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'voltz_balance') THEN
    -- First copy data to spendable_voltz if needed
    UPDATE public.profiles SET spendable_voltz = COALESCE(voltz_balance, 100) WHERE spendable_voltz IS NULL;
    -- Then drop the old column
    ALTER TABLE public.profiles DROP COLUMN voltz_balance;
  END IF;
  
  -- Remove total_xp column if it was created (we use existing xp field instead)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_xp') THEN
    ALTER TABLE public.profiles DROP COLUMN total_xp;
  END IF;
END $$;

-- Update existing XP ledger entries to have transaction_type if they don't
UPDATE public.xp_ledger 
SET transaction_type = 'earned' 
WHERE transaction_type IS NULL;

COMMIT;
