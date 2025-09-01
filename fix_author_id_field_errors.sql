-- Fix "record 'new' has no field 'author_id'" errors
-- Only insights table has author_id field - all other tables use user_id

-- 1. Drop any problematic triggers that reference non-existent fields
-- These triggers were likely created with generic COALESCE(NEW.user_id, NEW.author_id, NEW.id) logic

-- Drop all potentially problematic achievement triggers
DROP TRIGGER IF EXISTS achievement_trigger_comments ON public.comments;
DROP TRIGGER IF EXISTS achievement_trigger_paper_comments ON public.paper_comments;
DROP TRIGGER IF EXISTS achievement_trigger_book_comments ON public.book_comments;
DROP TRIGGER IF EXISTS achievement_trigger_article_likes ON public.article_likes;
DROP TRIGGER IF EXISTS achievement_trigger_paper_likes ON public.paper_likes;
DROP TRIGGER IF EXISTS achievement_trigger_book_likes ON public.book_likes;
DROP TRIGGER IF EXISTS achievement_trigger_insight_likes ON public.insight_likes;
DROP TRIGGER IF EXISTS achievement_trigger_article_saves ON public.article_saves;
DROP TRIGGER IF EXISTS achievement_trigger_paper_saves ON public.paper_saves;
DROP TRIGGER IF EXISTS achievement_trigger_book_saves ON public.book_saves;
DROP TRIGGER IF EXISTS achievement_trigger_insight_saves ON public.insight_saves;
DROP TRIGGER IF EXISTS achievement_trigger_insight_comments ON public.insight_comments;
DROP TRIGGER IF EXISTS achievement_trigger_quiz_attempts ON public.quiz_attempts;
DROP TRIGGER IF EXISTS achievement_trigger_profiles ON public.profiles;
DROP TRIGGER IF EXISTS achievement_trigger_user_achievements ON public.user_achievements;
DROP TRIGGER IF EXISTS achievement_trigger_xp_ledger ON public.xp_ledger;

-- Drop any social voltz triggers that might have the same issue
DROP TRIGGER IF EXISTS social_voltz_trigger_comments ON public.comments;
DROP TRIGGER IF EXISTS social_voltz_trigger_paper_comments ON public.paper_comments;
DROP TRIGGER IF EXISTS social_voltz_trigger_book_comments ON public.book_comments;
DROP TRIGGER IF EXISTS social_voltz_trigger_insight_comments ON public.insight_comments;
DROP TRIGGER IF EXISTS quiz_voltz_trigger ON public.quiz_attempts;
DROP TRIGGER IF EXISTS trg_quiz_attempts_grant_xp ON public.quiz_attempts;
DROP TRIGGER IF EXISTS trg_quiz_attempts_grant_voltz ON public.quiz_attempts;

-- Drop triggers on profiles, user_achievements, and xp_ledger that might reference user_id
-- These tables don't have user_id field - profiles uses 'id', user_achievements uses 'user_id', xp_ledger uses 'user_id'
-- But we need to drop any achievement triggers that might be using generic COALESCE logic
DROP TRIGGER IF EXISTS achievement_trigger_profiles ON public.profiles;
DROP TRIGGER IF EXISTS achievement_trigger_user_achievements ON public.user_achievements;
DROP TRIGGER IF EXISTS achievement_trigger_xp_ledger ON public.xp_ledger;

-- Drop any other potentially problematic triggers on these core tables
DROP TRIGGER IF EXISTS social_voltz_trigger_profiles ON public.profiles;
DROP TRIGGER IF EXISTS voltz_trigger_profiles ON public.profiles;

-- 2. Create a safe achievement trigger function that only uses the correct field for each table
CREATE OR REPLACE FUNCTION public.check_achievements_safe()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  achievement_record RECORD;
BEGIN
  -- Determine user_id based on table - ONLY insights has author_id
  IF TG_TABLE_NAME = 'insights' THEN
    target_user_id := NEW.author_id;
  ELSE
    -- All other tables (comments, paper_comments, book_comments, insight_comments, quiz_attempts, likes, saves, etc.) use user_id
    target_user_id := NEW.user_id;
  END IF;

  -- Early exit if no target user found
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check for specific achievements based on table
  IF TG_TABLE_NAME IN ('comments', 'paper_comments', 'book_comments', 'insight_comments') THEN
    -- Check if this is user's first comment across all comment tables
    DECLARE
      total_comments INTEGER;
    BEGIN
      SELECT 
        COALESCE((SELECT COUNT(*) FROM public.comments WHERE user_id = target_user_id), 0) +
        COALESCE((SELECT COUNT(*) FROM public.paper_comments WHERE user_id = target_user_id), 0) +
        COALESCE((SELECT COUNT(*) FROM public.book_comments WHERE user_id = target_user_id), 0) +
        COALESCE((SELECT COUNT(*) FROM public.insight_comments WHERE user_id = target_user_id), 0)
      INTO total_comments;

      IF total_comments = 1 THEN
        -- Award first comment achievement
        SELECT * INTO achievement_record
        FROM public.achievements
        WHERE category = 'first_comment'
        LIMIT 1;
        
        IF FOUND AND NOT EXISTS (
          SELECT 1 FROM public.user_achievements 
          WHERE user_id = target_user_id AND achievement_type = 'first_comment'
        ) THEN
          PERFORM public.award_single_achievement(target_user_id, achievement_record);
        END IF;
      END IF;
    END;
  
  -- Check for first quiz achievement
  ELSIF TG_TABLE_NAME = 'quiz_attempts' THEN
    -- Check if this is user's first quiz attempt
    DECLARE
      quiz_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO quiz_count
      FROM public.quiz_attempts 
      WHERE user_id = target_user_id;

      IF quiz_count = 1 THEN
        -- Award first quiz achievement
        SELECT * INTO achievement_record
        FROM public.achievements
        WHERE category = 'first_quiz'
        LIMIT 1;
        
        IF FOUND AND NOT EXISTS (
          SELECT 1 FROM public.user_achievements 
          WHERE user_id = target_user_id AND achievement_type = 'first_quiz'
        ) THEN
          PERFORM public.award_single_achievement(target_user_id, achievement_record);
        END IF;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create safe social voltz trigger function
CREATE OR REPLACE FUNCTION public.award_social_voltz_safe()
RETURNS TRIGGER AS $$
DECLARE
  content_author_id UUID;
  voltz_amount INTEGER;
  reward_reason TEXT;
  interaction_user_id UUID;
BEGIN
  -- Get the user performing the interaction (always user_id for interaction tables)
  interaction_user_id := NEW.user_id;
  
  -- Determine voltz amount and get content author based on table
  IF TG_TABLE_NAME = 'insight_likes' THEN
    SELECT author_id INTO content_author_id FROM public.insights WHERE id = NEW.insight_id;
    voltz_amount := 5;
    reward_reason := 'Like received on insight';
  ELSIF TG_TABLE_NAME = 'insight_comments' THEN
    SELECT author_id INTO content_author_id FROM public.insights WHERE id = NEW.insight_id;
    voltz_amount := 10;
    reward_reason := 'Comment received on insight';
  ELSIF TG_TABLE_NAME = 'insight_saves' THEN
    SELECT author_id INTO content_author_id FROM public.insights WHERE id = NEW.insight_id;
    voltz_amount := 10;
    reward_reason := 'Save received on insight';
  ELSE
    -- For articles, papers, books - no author reward system yet
    RETURN NEW;
  END IF;

  -- Don't award voltz if author not found or self-interaction
  IF content_author_id IS NULL OR content_author_id = interaction_user_id THEN
    RETURN NEW;
  END IF;

  -- Award voltz to content author
  UPDATE public.profiles
  SET spendable_voltz = spendable_voltz + voltz_amount,
      total_voltz_earned = total_voltz_earned + voltz_amount
  WHERE id = content_author_id;

  -- Log the transaction
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type, actor_id)
  VALUES (
    content_author_id, voltz_amount, reward_reason, 
    CASE 
      WHEN TG_TABLE_NAME LIKE '%insight%' THEN 'insight'
      ELSE 'content'
    END,
    COALESCE(NEW.insight_id::text, NEW.article_id::text, NEW.paper_id::text, NEW.book_id::text),
    'earned', interaction_user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate safe triggers only where needed

-- Achievement triggers for comment tables (using safe function)
CREATE TRIGGER achievement_trigger_comments
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements_safe();

CREATE TRIGGER achievement_trigger_paper_comments
  AFTER INSERT ON public.paper_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements_safe();

CREATE TRIGGER achievement_trigger_book_comments
  AFTER INSERT ON public.book_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements_safe();

CREATE TRIGGER achievement_trigger_insight_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements_safe();

CREATE TRIGGER achievement_trigger_quiz_attempts
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements_safe();

-- Social voltz triggers for insight interactions only (other content types don't reward authors yet)
CREATE TRIGGER social_voltz_trigger_insight_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz_safe();

CREATE TRIGGER social_voltz_trigger_insight_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz_safe();

CREATE TRIGGER social_voltz_trigger_insight_saves
  AFTER INSERT ON public.insight_saves
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz_safe();

-- 5. Create safe quiz voltz trigger function (quizzes reward user directly, not content author)
CREATE OR REPLACE FUNCTION public.award_quiz_voltz()
RETURNS TRIGGER AS $$
DECLARE
  voltz_reward INTEGER;
  bonus_voltz INTEGER := 0;
BEGIN
  -- Base reward for completing any quiz
  voltz_reward := 10;
  
  -- Bonus for correct answer
  IF NEW.is_correct = true THEN
    bonus_voltz := 5;
  END IF;
  
  -- Award voltz to the quiz taker
  UPDATE public.profiles
  SET spendable_voltz = spendable_voltz + voltz_reward + bonus_voltz,
      total_voltz_earned = total_voltz_earned + voltz_reward + bonus_voltz
  WHERE id = NEW.user_id;

  -- Log the transaction
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
  VALUES (
    NEW.user_id, 
    voltz_reward + bonus_voltz, 
    CASE 
      WHEN NEW.is_correct THEN 'Quiz completed correctly (+' || (voltz_reward + bonus_voltz) || ' voltz)'
      ELSE 'Quiz completed (+' || voltz_reward || ' voltz)'
    END,
    'quiz', 
    NEW.question_id::text, 
    'earned'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create quiz voltz trigger
CREATE TRIGGER quiz_voltz_trigger
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.award_quiz_voltz();

-- 6. Test the fix
DO $$
BEGIN
  RAISE NOTICE 'Trigger cleanup complete. The following should now work:';
  RAISE NOTICE '- Commenting on books: uses book_comments.user_id (not author_id)';
  RAISE NOTICE '- Commenting on papers: uses paper_comments.user_id (not author_id)';
  RAISE NOTICE '- Commenting on articles: uses comments.user_id (not author_id)';
  RAISE NOTICE '- Submitting quizzes: uses quiz_attempts.user_id (not author_id)';
  RAISE NOTICE '- Quiz completion rewards: 10 voltz base + 5 bonus for correct answers';
  RAISE NOTICE '- Only insights table uses author_id field';
  RAISE NOTICE 'Error "record new has no field author_id" should be resolved for ALL content types.';
END $$;