-- Fix the level calculation bug in update_user_voltz function

BEGIN;

-- Replace the buggy function with correct level calculation
CREATE OR REPLACE FUNCTION public.update_user_voltz(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT DEFAULT 'earned',
  p_reason TEXT DEFAULT 'system',
  p_subject_type TEXT DEFAULT NULL,
  p_subject_id TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  new_total_voltz INTEGER;
BEGIN
  IF p_transaction_type = 'earned' THEN
    -- First, calculate what the new total will be
    SELECT COALESCE(total_voltz_earned, 0) + p_amount 
    INTO new_total_voltz 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    -- Now update with the correct level based on the NEW total
    UPDATE public.profiles 
    SET 
      total_voltz_earned = new_total_voltz,
      spendable_voltz = COALESCE(spendable_voltz, 0) + p_amount,
      level = GREATEST(1, FLOOR(new_total_voltz / 20) + 1)
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

-- Also fix any users who currently have incorrect levels
-- This will recalculate levels for all users based on their current total_voltz_earned
UPDATE public.profiles 
SET level = GREATEST(1, FLOOR(COALESCE(total_voltz_earned, 0) / 20) + 1)
WHERE level != GREATEST(1, FLOOR(COALESCE(total_voltz_earned, 0) / 20) + 1);

COMMIT;

-- Verification: Show current user levels vs what they should be
SELECT 
    id,
    full_name,
    total_voltz_earned,
    level as current_level,
    GREATEST(1, FLOOR(COALESCE(total_voltz_earned, 0) / 20) + 1) as correct_level,
    CASE 
        WHEN level = GREATEST(1, FLOOR(COALESCE(total_voltz_earned, 0) / 20) + 1) THEN 'CORRECT'
        ELSE 'FIXED'
    END as status
FROM profiles 
WHERE total_voltz_earned >= 20 OR level > 1
ORDER BY total_voltz_earned DESC
LIMIT 10;