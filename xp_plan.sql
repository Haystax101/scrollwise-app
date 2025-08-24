-- Extra SQL helpers for XP plan (optional trigger for quiz attempts + RPC wrapper)
-- Safe to run multiple times

BEGIN;

-- Function to submit a quiz attempt securely and return correctness
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_user_id uuid,
  p_question_id uuid,
  p_selected integer
) RETURNS TABLE (is_correct boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  correct_opt integer;
  was_inserted boolean := false;
BEGIN
  SELECT correct_option_index INTO correct_opt FROM public.quiz_questions WHERE id = p_question_id;
  IF correct_opt IS NULL THEN
    RETURN QUERY SELECT false;
    RETURN;
  END IF;

  -- Insert attempt (enforced UNIQUE (user_id, question_id))
  INSERT INTO public.quiz_attempts (user_id, question_id, selected_option_index, is_correct)
  VALUES (p_user_id, p_question_id, p_selected, p_selected = correct_opt)
  ON CONFLICT (user_id, question_id) DO NOTHING;

  -- Determine whether the row exists and whether it's correct
  RETURN QUERY
  SELECT qa.is_correct FROM public.quiz_attempts qa
  WHERE qa.user_id = p_user_id AND qa.question_id = p_question_id
  LIMIT 1;
END;$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, uuid, integer) TO authenticated;

-- Trigger to auto-grant XP when a correct quiz attempt is inserted
CREATE OR REPLACE FUNCTION public.trg_quiz_attempts_grant_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_correct THEN
    -- Award 5 XP for correct quiz answers
    INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, actor_id)
    VALUES (NEW.user_id, 5, 'quiz_correct', 'quiz_question', NEW.question_id::text, NEW.user_id)
    ON CONFLICT DO NOTHING;
    
    -- Update user's total XP and level
    PERFORM public.update_user_xp_and_level(NEW.user_id, 5);
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_quiz_attempts_grant_xp ON public.quiz_attempts;
CREATE TRIGGER trg_quiz_attempts_grant_xp
AFTER INSERT ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.trg_quiz_attempts_grant_xp();

COMMIT;


