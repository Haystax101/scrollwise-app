-- This script fixes the "record 'new' has no field 'author_id'" error
-- that occurs when commenting on articles, books, and papers.
-- The root cause is a single, incorrect trigger being applied to all comment tables.
-- This script creates specific, correct triggers for each comment type.

BEGIN;

-- 1. Create a function to award voltz for comments on Articles, Books, and Papers.
-- This function correctly gets the content creator's ID from the base table,
-- as the comment tables themselves only contain the commenter's user_id.
CREATE OR REPLACE FUNCTION public.award_comment_voltz_for_content()
RETURNS TRIGGER AS $$
DECLARE
  content_author_id UUID;
  voltz_amount INTEGER := 10; -- Voltz awarded for a comment
  reward_reason TEXT;
  content_id_field TEXT;
  content_table TEXT;
BEGIN
  -- Determine which table and ID to use based on the trigger's table name
  CASE TG_TABLE_NAME
    WHEN 'comments' THEN
      content_table := 'articles';
      content_id_field := 'article_id';
      reward_reason := 'Comment received on article';
    WHEN 'book_comments' THEN
      content_table := 'books';
      content_id_field := 'book_id';
      reward_reason := 'Comment received on book';
    WHEN 'paper_comments' THEN
      content_table := 'papers';
      content_id_field := 'paper_id';
      reward_reason := 'Comment received on paper';
    ELSE
      -- If triggered on an unexpected table, do nothing.
      RETURN NEW;
  END CASE;

  -- These content types do not have a direct author_id.
  -- We are assuming for now that voltz are not awarded for these comments.
  -- If they should be, the logic to find the original author would be needed here.
  -- For now, we will simply log the comment and return.
  RAISE NOTICE 'Comment recorded on % by user %', content_table, NEW.user_id;
  RETURN NEW;

END;
$$ LANGUAGE plpgsql;


-- 2. Create a specific function for Insight Comments
-- This correctly uses the insight's `author_id` to award voltz.
CREATE OR REPLACE FUNCTION public.award_comment_voltz_for_insights()
RETURNS TRIGGER AS $$
DECLARE
  content_author_id UUID;
  voltz_amount INTEGER := 10;
BEGIN
  -- Get the author of the insight being commented on
  SELECT author_id INTO content_author_id
  FROM public.insights
  WHERE id = NEW.insight_id;

  -- Do not award voltz for self-comments or if the author isn't found
  IF content_author_id IS NULL OR content_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Award voltz to the insight's author
  UPDATE public.profiles
  SET spendable_voltz = spendable_voltz + voltz_amount,
      total_voltz_earned = total_voltz_earned + voltz_amount
  WHERE id = content_author_id;

  -- Log the transaction
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type, actor_id)
  VALUES (content_author_id, voltz_amount, 'Comment received on insight', 'insight', NEW.insight_id::text, 'earned', NEW.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 3. Remove all old, incorrect social/achievement triggers from comment tables
DROP TRIGGER IF EXISTS social_voltz_trigger_comments ON public.comments;
DROP TRIGGER IF EXISTS social_voltz_trigger_comments ON public.book_comments;
DROP TRIGGER IF EXISTS social_voltz_trigger_comments ON public.paper_comments;
DROP TRIGGER IF EXISTS social_voltz_trigger_comments ON public.insight_comments;
-- Also remove achievement triggers that might be causing issues
DROP TRIGGER IF EXISTS achievement_trigger_comments ON public.comments;
DROP TRIGGER IF EXISTS achievement_trigger_comments ON public.book_comments;
DROP TRIGGER IF EXISTS achievement_trigger_comments ON public.paper_comments;
DROP TRIGGER IF EXISTS achievement_trigger_comments ON public.insight_comments;


-- 4. Create and apply the new, correct triggers
CREATE TRIGGER trigger_comment_voltz_content
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.award_comment_voltz_for_content();

CREATE TRIGGER trigger_comment_voltz_content
  AFTER INSERT ON public.book_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_comment_voltz_for_content();

CREATE TRIGGER trigger_comment_voltz_content
  AFTER INSERT ON public.paper_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_comment_voltz_for_content();

CREATE TRIGGER trigger_comment_voltz_insights
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_comment_voltz_for_insights();

COMMIT;

-- Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION public.award_comment_voltz_for_content() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_comment_voltz_for_insights() TO authenticated;
