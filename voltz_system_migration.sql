-- Voltz System Migration
-- This migration fixes the dual-tracking Voltz system and cleans up redundant fields
-- Run this migration after ensuring no critical operations are in progress

BEGIN;

-- Step 1: Add new total_voltz_earned field if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_voltz_earned INTEGER DEFAULT 0;

-- Step 2: Migrate existing XP data to total_voltz_earned
-- This ensures no data is lost during the migration
UPDATE public.profiles 
SET total_voltz_earned = COALESCE(xp, 0)
WHERE total_voltz_earned = 0;

-- Step 3: Ensure spendable_voltz has proper default
UPDATE public.profiles 
SET spendable_voltz = COALESCE(spendable_voltz, 100)
WHERE spendable_voltz IS NULL;

-- Step 4: Create/replace the unified Voltz management function
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
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Voltz amount must be positive';
  END IF;
  
  IF p_transaction_type NOT IN ('earned', 'spent') THEN
    RAISE EXCEPTION 'Transaction type must be earned or spent';
  END IF;
  
  -- Handle earning Voltz (increases both totals)
  IF p_transaction_type = 'earned' THEN
    UPDATE public.profiles 
    SET 
      total_voltz_earned = COALESCE(total_voltz_earned, 0) + p_amount,
      spendable_voltz = COALESCE(spendable_voltz, 0) + p_amount,
      level = GREATEST(1, FLOOR((COALESCE(total_voltz_earned, 0) + p_amount) / 20) + 1)
    WHERE id = p_user_id;
    
    -- Record in XP ledger for historical tracking
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
      p_subject_type, 
      p_subject_id, 
      COALESCE(p_actor_id, p_user_id),
      'earned'
    );
    
  -- Handle spending Voltz (only decreases spendable, never total_voltz_earned)
  ELSIF p_transaction_type = 'spent' THEN
    -- Check if user has enough spendable Voltz
    DECLARE
      current_spendable INTEGER;
    BEGIN
      SELECT spendable_voltz INTO current_spendable 
      FROM public.profiles 
      WHERE id = p_user_id;
      
      IF current_spendable IS NULL OR current_spendable < p_amount THEN
        RAISE EXCEPTION 'Insufficient spendable Voltz. Available: %, Required: %', 
          COALESCE(current_spendable, 0), p_amount;
      END IF;
      
      -- Spend the Voltz (total_voltz_earned remains unchanged)
      UPDATE public.profiles 
      SET spendable_voltz = spendable_voltz - p_amount
      WHERE id = p_user_id;
      
      -- Record spending in XP ledger with negative amount for tracking
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
        -p_amount,  -- Negative to indicate spending
        p_reason, 
        p_subject_type, 
        p_subject_id, 
        COALESCE(p_actor_id, p_user_id),
        'spent'
      );
    END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_voltz(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- Step 5: Update existing Voltz-related functions to use new system
CREATE OR REPLACE FUNCTION public.update_user_xp_and_level(
  p_user_id UUID,
  p_xp_to_add INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Redirect to new Voltz system
  PERFORM public.update_user_voltz(
    p_user_id,
    p_xp_to_add,
    'earned',
    'xp_migration',
    NULL,
    NULL,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create helper function to get user Voltz stats
CREATE OR REPLACE FUNCTION public.get_user_voltz_stats(p_user_id UUID)
RETURNS TABLE (
  total_voltz_earned INTEGER,
  spendable_voltz INTEGER,
  level INTEGER,
  level_progress INTEGER,
  voltz_to_next_level INTEGER
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT 
    profiles.total_voltz_earned,
    profiles.spendable_voltz,
    profiles.level
  INTO user_record
  FROM public.profiles 
  WHERE id = p_user_id;
  
  IF user_record IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate level progress (XP within current level)
  DECLARE
    xp_for_current_level INTEGER := (user_record.level - 1) * 20;
    progress_in_level INTEGER := user_record.total_voltz_earned - xp_for_current_level;
    xp_needed_for_next_level INTEGER := 20 - progress_in_level;
  BEGIN
    RETURN QUERY SELECT
      user_record.total_voltz_earned,
      user_record.spendable_voltz,
      user_record.level,
      progress_in_level,
      xp_needed_for_next_level;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_voltz_stats(UUID) TO authenticated;

-- Step 7: Update quiz trigger to use new Voltz system
CREATE OR REPLACE FUNCTION public.trg_quiz_attempts_grant_voltz()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_correct AND NEW.user_id IS NOT NULL THEN
    -- Award 5 Voltz for correct quiz answers using new system
    PERFORM public.update_user_voltz(
      NEW.user_id,
      5,
      'earned',
      'quiz_correct',
      'quiz_question',
      NEW.question_id::text,
      NEW.user_id
    );
  END IF;
  RETURN NEW;
END;$$;

-- Replace old trigger
DROP TRIGGER IF EXISTS trg_quiz_attempts_grant_xp ON public.quiz_attempts;
CREATE TRIGGER trg_quiz_attempts_grant_voltz
AFTER INSERT ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.trg_quiz_attempts_grant_voltz();

-- Step 8: Clean up redundant fields (COMMENTED OUT - uncomment after confirming migration)
-- Note: We'll keep the 'xp' field for now during transition, but mark it as deprecated
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_deprecated INTEGER DEFAULT 0;
-- UPDATE public.profiles SET xp_deprecated = xp;
-- In a future migration, after all apps are updated:
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS xp;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS videos_watched; -- if unused
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS minutes_learned; -- if moving to content_views

-- Step 9: Create view for backward compatibility (temporary during migration)
CREATE OR REPLACE VIEW public.profiles_with_xp AS
SELECT 
  id,
  created_at,
  full_name,
  avatar_url,
  days_streak,
  email,
  theme_preference,
  pro_plan,
  total_voltz_earned as xp, -- Map total_voltz_earned to xp for compatibility
  level,
  spendable_voltz,
  total_voltz_earned,
  videos_watched,
  minutes_learned
FROM public.profiles;

-- Step 10: RLS policies should already exist for profiles table
-- The existing policies will automatically cover the new fields
-- No additional policies needed for total_voltz_earned and spendable_voltz fields

COMMIT;

-- Post-migration verification queries:
-- SELECT id, total_voltz_earned, spendable_voltz, level FROM profiles LIMIT 5;
-- SELECT * FROM get_user_voltz_stats('your-user-id-here');