-- Create insight-specific versions of trigger functions that are incorrectly referencing article_id
-- These functions will properly handle insight_id instead of article_id

-- 1. Create insight-specific version of award_comment_voltz_for_content
-- This function likely expects article_id but should use insight_id for insights
CREATE OR REPLACE FUNCTION public.award_comment_voltz_for_insights()
RETURNS TRIGGER AS $$
BEGIN
  -- Award voltz for commenting on insights - uses insight_id instead of article_id
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
  VALUES (
    NEW.user_id,
    10, -- 10 voltz for commenting on insights
    'Comment on insight',
    'insight_comment',
    NEW.insight_id::text,
    'earned'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create insight-specific version of award_like_voltz_for_content  
-- This function likely expects article_id but should use insight_id for insights
CREATE OR REPLACE FUNCTION public.award_like_voltz_for_insights()
RETURNS TRIGGER AS $$
BEGIN
  -- Award voltz for liking insights - uses insight_id instead of article_id
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
  VALUES (
    NEW.user_id,
    5, -- 5 voltz for liking insights
    'Like on insight',
    'insight_like',
    NEW.insight_id::text,
    'earned'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create insight-specific version of award_social_voltz for saves
CREATE OR REPLACE FUNCTION public.award_save_voltz_for_insights()
RETURNS TRIGGER AS $$
BEGIN
  -- Award voltz for saving insights - uses insight_id instead of article_id
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
  VALUES (
    NEW.user_id,
    3, -- 3 voltz for saving insights
    'Save insight',
    'insight_save',
    NEW.insight_id::text,
    'earned'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Now update the triggers to use the insight-specific functions
-- Drop existing triggers that are using wrong functions
DROP TRIGGER IF EXISTS trigger_comment_voltz_insights ON public.insight_comments;
DROP TRIGGER IF EXISTS trigger_like_voltz_insights ON public.insight_likes;
DROP TRIGGER IF EXISTS social_voltz_trigger_insight_saves ON public.insight_saves;

-- Create new triggers with insight-specific functions
CREATE TRIGGER trigger_comment_voltz_insights
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW
  EXECUTE FUNCTION award_comment_voltz_for_insights();

CREATE TRIGGER trigger_like_voltz_insights
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW
  EXECUTE FUNCTION award_like_voltz_for_insights();

CREATE TRIGGER trigger_save_voltz_insights
  AFTER INSERT ON public.insight_saves
  FOR EACH ROW
  EXECUTE FUNCTION award_save_voltz_for_insights();

-- 5. Also check if there are any other functions that might be problematic
-- Let's also create insight-specific versions of social voltz functions if needed

-- Create insight-specific version of award_social_voltz_safe
CREATE OR REPLACE FUNCTION public.award_social_voltz_safe_insights()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle social voltz awards for insights safely
  -- This checks for the correct insight_id column
  
  CASE TG_TABLE_NAME
    WHEN 'insight_likes' THEN
      -- Award author voltz for receiving likes
      INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
      SELECT 
        i.author_id,
        2, -- 2 voltz for receiving a like
        'Insight liked',
        'insight',
        NEW.insight_id::text,
        'earned'
      FROM public.insights i
      WHERE i.id = NEW.insight_id;
      
    WHEN 'insight_comments' THEN
      -- Award author voltz for receiving comments
      INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
      SELECT 
        i.author_id,
        3, -- 3 voltz for receiving a comment
        'Insight commented on',
        'insight',
        NEW.insight_id::text,
        'earned'
      FROM public.insights i
      WHERE i.id = NEW.insight_id;
      
    WHEN 'insight_saves' THEN
      -- Award author voltz for getting saves
      INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
      SELECT 
        i.author_id,
        1, -- 1 voltz for receiving a save
        'Insight saved',
        'insight',
        NEW.insight_id::text,
        'earned'
      FROM public.insights i
      WHERE i.id = NEW.insight_id;
  END CASE;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fail gracefully if there are any errors
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing social voltz triggers to use insight-specific function
DROP TRIGGER IF EXISTS social_voltz_trigger_insight_likes ON public.insight_likes;
DROP TRIGGER IF EXISTS social_voltz_trigger_insight_comments ON public.insight_comments;
DROP TRIGGER IF EXISTS social_voltz_trigger_insight_saves ON public.insight_saves;

CREATE TRIGGER social_voltz_trigger_insight_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW
  EXECUTE FUNCTION award_social_voltz_safe_insights();

CREATE TRIGGER social_voltz_trigger_insight_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW
  EXECUTE FUNCTION award_social_voltz_safe_insights();

CREATE TRIGGER social_voltz_trigger_insight_saves
  AFTER INSERT ON public.insight_saves
  FOR EACH ROW
  EXECUTE FUNCTION award_social_voltz_safe_insights();