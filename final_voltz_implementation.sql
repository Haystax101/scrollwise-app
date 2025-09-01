-- FINAL VOLTZ SYSTEM IMPLEMENTATION
-- Run AFTER running clean_triggers.sql to ensure clean slate
-- This adds back only the essential functionality with correct field names

-- 1. Fix the achievement system to actually award voltz
CREATE OR REPLACE FUNCTION public.award_single_achievement(target_user_id UUID, achievement_record RECORD)
RETURNS VOID AS $$
BEGIN
  -- Insert the achievement award
  INSERT INTO public.user_achievements (
    user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
  ) VALUES (
    target_user_id, achievement_record.id, achievement_record.category,
    achievement_record.name, achievement_record.description, achievement_record.icon_name, NOW()
  );
  
  -- Award voltz (this was missing before!)
  UPDATE public.profiles 
  SET spendable_voltz = spendable_voltz + achievement_record.voltz_reward,
      total_voltz_earned = total_voltz_earned + achievement_record.voltz_reward
  WHERE id = target_user_id;
  
  -- Log voltz transaction
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
  VALUES (
    target_user_id, achievement_record.voltz_reward,
    'Achievement: ' || achievement_record.name, 'achievement', achievement_record.id::text, 'earned'
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Create achievement trigger that uses AUTHOR_ID not user_id
CREATE OR REPLACE FUNCTION public.award_achievements_for_insights()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
BEGIN
  -- Check for "First Insight" achievement using author_id
  IF NOT EXISTS (
    SELECT 1 FROM public.user_achievements 
    WHERE user_id = NEW.author_id AND achievement_type = 'first_insight'
  ) THEN
    -- Get the first insight achievement details
    SELECT * INTO achievement_record
    FROM public.achievements
    WHERE category = 'first_insight'
    LIMIT 1;
    
    IF FOUND THEN
      PERFORM public.award_single_achievement(NEW.author_id, achievement_record);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Add the insight achievement trigger
CREATE TRIGGER achievement_trigger_insights
  AFTER INSERT ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_for_insights();

-- 4. Social interaction voltz rewards
CREATE OR REPLACE FUNCTION public.award_social_voltz()
RETURNS TRIGGER AS $$
DECLARE
  content_author_id UUID;
  voltz_amount INTEGER;
  reward_reason TEXT;
BEGIN
  -- Determine voltz amount based on interaction type
  IF TG_TABLE_NAME = 'insight_likes' THEN
    voltz_amount := 5;
    reward_reason := 'Like received on insight';
  ELSIF TG_TABLE_NAME = 'insight_comments' THEN
    voltz_amount := 10;
    reward_reason := 'Comment received on insight';
  ELSIF TG_TABLE_NAME = 'insight_saves' THEN
    voltz_amount := 10;
    reward_reason := 'Save received on insight';
  ELSE
    RETURN NEW;
  END IF;

  -- Get the content author
  SELECT author_id INTO content_author_id
  FROM public.insights 
  WHERE id = NEW.insight_id;
  
  -- Don't award voltz if author not found or self-interaction
  IF content_author_id IS NULL OR content_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Award voltz to content author
  UPDATE public.profiles
  SET spendable_voltz = spendable_voltz + voltz_amount,
      total_voltz_earned = total_voltz_earned + voltz_amount
  WHERE id = content_author_id;

  -- Log transaction
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type, actor_id)
  VALUES (
    content_author_id, voltz_amount, reward_reason, 'insight', NEW.insight_id::text, 'earned', NEW.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Social interaction triggers
CREATE TRIGGER social_voltz_trigger_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz();

CREATE TRIGGER social_voltz_trigger_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz();

CREATE TRIGGER social_voltz_trigger_saves
  AFTER INSERT ON public.insight_saves
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz();

-- 6. Quiz voltz rewards
CREATE OR REPLACE FUNCTION public.award_quiz_voltz()
RETURNS TRIGGER AS $$
DECLARE
  voltz_amount INTEGER;
  reward_reason TEXT;
BEGIN
  -- Award based on correctness
  IF NEW.is_correct THEN
    voltz_amount := 20;
    reward_reason := 'Correct quiz answer';
  ELSE
    voltz_amount := 5;
    reward_reason := 'Quiz participation';
  END IF;

  -- Award voltz
  UPDATE public.profiles
  SET spendable_voltz = spendable_voltz + voltz_amount,
      total_voltz_earned = total_voltz_earned + voltz_amount
  WHERE id = NEW.user_id;

  -- Log transaction
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
  VALUES (
    NEW.user_id, voltz_amount, reward_reason, 'quiz', NEW.question_id::text, 'earned'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Quiz trigger
CREATE TRIGGER quiz_voltz_trigger
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.award_quiz_voltz();

-- 8. Insight supercharging (spend voltz to boost insights)
CREATE OR REPLACE FUNCTION public.handle_insight_supercharge()
RETURNS TRIGGER AS $$
DECLARE
  voltz_difference INTEGER;
  user_spendable INTEGER;
BEGIN
  -- Only handle increases in voltz_spent
  IF NEW.voltz_spent > COALESCE(OLD.voltz_spent, 0) THEN
    voltz_difference := NEW.voltz_spent - COALESCE(OLD.voltz_spent, 0);
    
    -- Check if user has enough voltz
    SELECT spendable_voltz INTO user_spendable
    FROM public.profiles
    WHERE id = NEW.author_id;
    
    IF user_spendable < voltz_difference THEN
      RAISE EXCEPTION 'Insufficient voltz: user has % but needs %', user_spendable, voltz_difference;
    END IF;
    
    -- Deduct voltz
    UPDATE public.profiles
    SET spendable_voltz = spendable_voltz - voltz_difference
    WHERE id = NEW.author_id;
    
    -- Log transaction
    INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
    VALUES (
      NEW.author_id, -voltz_difference, 'Supercharge insight', 'insight', NEW.id::text, 'spent'
    );
    
    -- Mark as supercharged
    NEW.supercharged := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Supercharge trigger (only on UPDATE when voltz_spent changes)
CREATE TRIGGER insight_supercharge_trigger
  BEFORE UPDATE ON public.insights
  FOR EACH ROW 
  WHEN (OLD.voltz_spent IS DISTINCT FROM NEW.voltz_spent AND NEW.voltz_spent > 0)
  EXECUTE FUNCTION public.handle_insight_supercharge();

-- 10. Grant permissions
GRANT EXECUTE ON FUNCTION public.award_single_achievement(UUID, RECORD) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_achievements_for_insights() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_social_voltz() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_quiz_voltz() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_insight_supercharge() TO authenticated;

-- Test insight insertion (should work without user_id errors)
SELECT 'Final voltz system implementation complete' as status;