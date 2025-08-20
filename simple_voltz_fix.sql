-- Simple Voltz System Fix
-- Just add the fields and functions without triggering profile completion loops

BEGIN;

-- Add the new field if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_voltz_earned INTEGER DEFAULT 0;

-- Copy existing XP data only for rows that don't have total_voltz_earned set
UPDATE public.profiles 
SET total_voltz_earned = COALESCE(xp, 0)
WHERE total_voltz_earned = 0;

-- Ensure spendable_voltz is properly set
UPDATE public.profiles 
SET spendable_voltz = COALESCE(spendable_voltz, 100)
WHERE spendable_voltz IS NULL;

-- Add transaction_type to xp_ledger if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'xp_ledger' AND column_name = 'transaction_type') THEN
    ALTER TABLE public.xp_ledger ADD COLUMN transaction_type text DEFAULT 'earned';
  END IF;
END $$;

-- Create the Voltz management function (simplified to avoid trigger loops)
CREATE OR REPLACE FUNCTION public.update_user_voltz(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT DEFAULT 'earned',
  p_reason TEXT DEFAULT 'system',
  p_subject_type TEXT DEFAULT NULL,
  p_subject_id TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF p_transaction_type = 'earned' THEN
    UPDATE public.profiles 
    SET 
      total_voltz_earned = COALESCE(total_voltz_earned, 0) + p_amount,
      spendable_voltz = COALESCE(spendable_voltz, 0) + p_amount,
      level = GREATEST(1, FLOOR((COALESCE(total_voltz_earned, 0) + p_amount) / 20) + 1)
    WHERE id = p_user_id;
    
    INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, actor_id, transaction_type)
    VALUES (p_user_id, p_amount, p_reason, p_subject_type, p_subject_id, COALESCE(p_actor_id, p_user_id), 'earned');
    
  ELSIF p_transaction_type = 'spent' THEN
    UPDATE public.profiles 
    SET spendable_voltz = GREATEST(0, COALESCE(spendable_voltz, 0) - p_amount)
    WHERE id = p_user_id AND COALESCE(spendable_voltz, 0) >= p_amount;
    
    INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, actor_id, transaction_type)
    VALUES (p_user_id, -p_amount, p_reason, p_subject_type, p_subject_id, COALESCE(p_actor_id, p_user_id), 'spent');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_user_voltz(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

COMMIT;