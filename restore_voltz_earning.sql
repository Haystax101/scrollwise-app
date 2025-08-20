-- Restore Voltz earning functionality for quizzes and insight interactions

BEGIN;

-- 1. Create the quiz trigger for earning Voltz
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

-- Create the quiz trigger
DROP TRIGGER IF EXISTS trg_quiz_attempts_grant_voltz ON public.quiz_attempts;
CREATE TRIGGER trg_quiz_attempts_grant_voltz
AFTER INSERT ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.trg_quiz_attempts_grant_voltz();

-- 2. Update insight interaction functions to use new Voltz system
-- Check if the old XP function exists and update it
CREATE OR REPLACE FUNCTION public.grant_xp_for_insight_interaction(
  p_insight_id bigint,
  p_author_id uuid,
  p_interaction_type text DEFAULT 'like'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Determine Voltz amount based on interaction type
  DECLARE
    voltz_amount INTEGER := CASE 
      WHEN p_interaction_type = 'like' THEN 2
      WHEN p_interaction_type = 'save' THEN 3
      WHEN p_interaction_type = 'comment' THEN 5
      ELSE 1
    END;
  BEGIN
    -- Use the new Voltz system
    PERFORM public.update_user_voltz(
      p_author_id,
      voltz_amount,
      'earned',
      'insight_' || p_interaction_type,
      'insight',
      p_insight_id::text,
      p_author_id
    );
  END;
END;$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.grant_xp_for_insight_interaction(bigint, uuid, text) TO authenticated;

-- 3. Create a general content interaction Voltz function
CREATE OR REPLACE FUNCTION public.grant_voltz_for_content_interaction(
  p_content_type text,
  p_content_id bigint,
  p_author_id uuid,
  p_interaction_type text DEFAULT 'like'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Determine Voltz amount based on interaction type
  DECLARE
    voltz_amount INTEGER := CASE 
      WHEN p_interaction_type = 'like' THEN 2
      WHEN p_interaction_type = 'save' THEN 3
      WHEN p_interaction_type = 'comment' THEN 5
      WHEN p_interaction_type = 'share' THEN 4
      ELSE 1
    END;
  BEGIN
    -- Use the new Voltz system
    PERFORM public.update_user_voltz(
      p_author_id,
      voltz_amount,
      'earned',
      p_content_type || '_' || p_interaction_type,
      p_content_type,
      p_content_id::text,
      p_author_id
    );
  END;
END;$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.grant_voltz_for_content_interaction(text, bigint, uuid, text) TO authenticated;

-- 4. Create helper function to get user stats for debugging
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
  
  -- Calculate level progress (Voltz within current level)
  DECLARE
    voltz_for_current_level INTEGER := (user_record.level - 1) * 20;
    progress_in_level INTEGER := user_record.total_voltz_earned - voltz_for_current_level;
    voltz_needed_for_next_level INTEGER := GREATEST(0, 20 - progress_in_level);
  BEGIN
    RETURN QUERY SELECT
      user_record.total_voltz_earned,
      user_record.spendable_voltz,
      user_record.level,
      progress_in_level,
      voltz_needed_for_next_level;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_voltz_stats(UUID) TO authenticated;

COMMIT;

-- Test query to verify functions exist
SELECT 
  routine_name, 
  routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%voltz%' OR routine_name LIKE '%quiz%grant%'
ORDER BY routine_name;