-- This script fixes the "like count rollback" issue that occurs when liking
-- articles, books, and papers. The issue is caused by a generic trigger
-- trying to find an `author_id` on tables that do not have one.

-- This script creates two distinct trigger functions:
-- 1. A function specifically for insight likes, which awards Voltz to the author.
-- 2. A function for other content types (articles, books, papers) that does not
--    attempt to award Voltz, thus preventing the trigger from failing.

BEGIN;

-- 1. Create a specific function for awarding Voltz on INSIGHT likes.
-- This correctly finds the author of the insight and awards them Voltz.
CREATE OR REPLACE FUNCTION public.award_like_voltz_for_insights()
RETURNS TRIGGER AS $$
DECLARE
  content_author_id UUID;
  voltz_amount INTEGER := 5; -- Standard voltz reward for a like
BEGIN
  -- Get the author of the insight that was liked
  SELECT author_id INTO content_author_id
  FROM public.insights
  WHERE id = NEW.insight_id;

  -- Do not award Voltz for self-likes or if the author is not found
  IF content_author_id IS NULL OR content_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Award Voltz to the insight's author
  UPDATE public.profiles
  SET spendable_voltz = spendable_voltz + voltz_amount,
      total_voltz_earned = total_voltz_earned + voltz_amount
  WHERE id = content_author_id;

  -- Log the transaction
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type, actor_id)
  VALUES (content_author_id, voltz_amount, 'Like received on insight', 'insight', NEW.insight_id::text, 'earned', NEW.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2. Create a placeholder function for other content likes.
-- Articles, books, and papers do not have a system user as an author,
-- so this function does nothing except succeed, which prevents the transaction rollback.
CREATE OR REPLACE FUNCTION public.handle_content_like()
RETURNS TRIGGER AS $$
BEGIN
  -- This function is a placeholder. It ensures the trigger succeeds
  -- without performing any actions, preventing the main 'like' action from
  -- being rolled back.
  RAISE NOTICE 'Like handled for content on table: %', TG_TABLE_NAME;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 3. Remove all old, incorrect 'social_voltz' or 'achievement' triggers from ALL like tables.
-- This ensures a clean slate before applying the new, correct triggers.
DROP TRIGGER IF EXISTS social_voltz_trigger_likes ON public.insight_likes;
DROP TRIGGER IF EXISTS social_voltz_trigger_likes ON public.article_likes;
DROP TRIGGER IF EXISTS social_voltz_trigger_likes ON public.book_likes;
DROP TRIGGER IF EXISTS social_voltz_trigger_likes ON public.paper_likes;

DROP TRIGGER IF EXISTS achievement_trigger_likes ON public.insight_likes;
DROP TRIGGER IF EXISTS achievement_trigger_likes ON public.article_likes;
DROP TRIGGER IF EXISTS achievement_trigger_likes ON public.book_likes;
DROP TRIGGER IF EXISTS achievement_trigger_likes ON public.paper_likes;


-- 4. Apply the new, specific triggers to the correct tables.
CREATE TRIGGER trigger_like_voltz_insights
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_like_voltz_for_insights();

CREATE TRIGGER trigger_handle_content_like
  AFTER INSERT ON public.article_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_content_like();

CREATE TRIGGER trigger_handle_content_like
  AFTER INSERT ON public.book_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_content_like();

CREATE TRIGGER trigger_handle_content_like
  AFTER INSERT ON public.paper_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_content_like();


COMMIT;

-- 5. Grant permissions for the new functions.
GRANT EXECUTE ON FUNCTION public.award_like_voltz_for_insights() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_content_like() TO authenticated;
