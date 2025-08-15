-- Create insight interaction XP functions
-- This handles XP awards for insight likes, saves, and comments

BEGIN;

-- Function to grant XP for insight interactions (likes, saves, comments)
CREATE OR REPLACE FUNCTION public.grant_xp_for_insight_interaction(
  p_insight_id bigint,
  p_author_id uuid,
  p_actor_id uuid,
  p_reason text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only grant XP if actor is not the author (can't give yourself XP)
  IF p_author_id = p_actor_id THEN
    RETURN;
  END IF;

  -- Insert XP record (idempotent - will not duplicate)
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, actor_id)
  VALUES (
    p_author_id, 
    CASE 
      WHEN p_reason = 'insight_like' THEN 2
      WHEN p_reason = 'insight_save' THEN 3
      WHEN p_reason = 'insight_comment' THEN 5
      ELSE 1
    END,
    p_reason,
    'insight',
    p_insight_id::text,
    p_actor_id
  )
  ON CONFLICT (user_id, reason, subject_type, subject_id, actor_id) DO NOTHING;
  
  -- Update author's total XP and level
  PERFORM public.update_user_xp_and_level(
    p_author_id, 
    CASE 
      WHEN p_reason = 'insight_like' THEN 2
      WHEN p_reason = 'insight_save' THEN 3
      WHEN p_reason = 'insight_comment' THEN 5
      ELSE 1
    END
  );
END;$$;

GRANT EXECUTE ON FUNCTION public.grant_xp_for_insight_interaction(bigint, uuid, uuid, text) TO authenticated;

-- Ensure insight tables have proper interaction counting
-- Update insight counts when interactions change

-- Function to update insight counts
CREATE OR REPLACE FUNCTION public.update_insight_counts(p_insight_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  like_count integer;
  save_count integer;
  comment_count integer;
BEGIN
  -- Count likes
  SELECT COUNT(*) INTO like_count
  FROM public.insight_likes
  WHERE insight_id = p_insight_id;
  
  -- Count saves  
  SELECT COUNT(*) INTO save_count
  FROM public.insight_saves
  WHERE insight_id = p_insight_id;
  
  -- Count comments
  SELECT COUNT(*) INTO comment_count
  FROM public.insight_comments
  WHERE insight_id = p_insight_id;
  
  -- Update the insight record
  UPDATE public.insights
  SET 
    likes_count = like_count,
    saves_count = save_count,
    comments_count = comment_count
  WHERE id = p_insight_id;
END;$$;

GRANT EXECUTE ON FUNCTION public.update_insight_counts(bigint) TO authenticated;

COMMIT;