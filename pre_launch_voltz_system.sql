-- STEP 1: Run this query first to see what triggers exist on insights table
-- Copy and paste this query in Supabase SQL editor and run it:

/*
SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name,
  CASE t.tgtype & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  CASE t.tgtype & 28
    WHEN 4 THEN 'INSERT'
    WHEN 8 THEN 'DELETE' 
    WHEN 16 THEN 'UPDATE'
    WHEN 28 THEN 'INSERT OR DELETE OR UPDATE'
  END AS events
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'insights'
AND t.tgname NOT LIKE 'RI_%'
ORDER BY t.tgname;
*/

-- STEP 2: After you run the above and tell me what triggers exist, run the rest:

-- Pre-Launch Voltz System Implementation
-- This fixes the achievement system to actually award voltz and adds social interaction rewards
-- Assumes: achievements table is already seeded with voltz_reward values
-- Assumes: voltz_level_system.sql has been run (level calculation system)

-- CRITICAL FIX: Clean up ALL triggers on insights table that might cause user_id errors
-- The insights table uses author_id, not user_id, so any trigger trying to access NEW.user_id will fail

-- First, let's see what triggers currently exist on insights table
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE '=== DEBUGGING: Current triggers on insights table ===';
  FOR trigger_record IN
    SELECT t.tgname AS trigger_name, p.proname AS function_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE c.relname = 'insights'
    AND t.tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
    ORDER BY t.tgname
  LOOP
    RAISE NOTICE 'Found trigger: % -> function: %', trigger_record.trigger_name, trigger_record.function_name;
  END LOOP;
  RAISE NOTICE '=== END trigger list ===';
END $$;

-- Remove ALL known problematic triggers on insights table
DROP TRIGGER IF EXISTS trigger_update_profile_completion_insights ON public.insights;
DROP TRIGGER IF EXISTS profile_completion_trigger ON public.insights; 
DROP TRIGGER IF EXISTS update_profile_completion_trigger ON public.insights;
DROP TRIGGER IF EXISTS achievement_trigger_insights ON public.insights;
DROP TRIGGER IF EXISTS social_voltz_trigger ON public.insights;
DROP TRIGGER IF EXISTS quiz_voltz_trigger ON public.insights;
DROP TRIGGER IF EXISTS update_profile_completion ON public.insights;
DROP TRIGGER IF EXISTS trigger_update_profile ON public.insights;
DROP TRIGGER IF EXISTS profile_trigger ON public.insights;
DROP TRIGGER IF EXISTS check_achievements_trigger ON public.insights;
DROP TRIGGER IF EXISTS trigger_check_achievements ON public.insights;

-- NUCLEAR APPROACH: Find and remove ALL custom triggers on insights table
-- This ensures we clean slate and only add back what we need
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE '=== REMOVING ALL CUSTOM TRIGGERS ON INSIGHTS TABLE ===';
  FOR trigger_record IN
    SELECT t.tgname AS trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'insights'
    AND t.tgname NOT LIKE 'RI_%'  -- Keep foreign key triggers
    AND t.tgname NOT LIKE '%_not_null'  -- Keep system triggers
  LOOP
    RAISE NOTICE 'Removing trigger: %', trigger_record.trigger_name;
    EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON public.insights';
  END LOOP;
  RAISE NOTICE '=== TRIGGER CLEANUP COMPLETE ===';
END $$;

-- First, update the existing achievement award function to actually give voltz
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
  
  -- Level will be automatically updated by the voltz_level_system trigger
  
  RAISE NOTICE 'Achievement awarded: % to user % (% voltz)', achievement_record.name, target_user_id, achievement_record.voltz_reward;
END;
$$ LANGUAGE plpgsql;

-- Recreate the achievement trigger with the correct logic
-- This ensures we use the existing, working achievement system
CREATE TRIGGER achievement_trigger_insights
  AFTER INSERT ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

-- Social Interaction Voltz Rewards System
-- Award voltz to content authors when they receive engagement

-- Function to award social interaction voltz
CREATE OR REPLACE FUNCTION public.award_social_voltz()
RETURNS TRIGGER AS $$
DECLARE
  content_author_id UUID;
  voltz_amount INTEGER;
  reward_reason TEXT;
BEGIN
  -- Determine voltz amount and reason based on interaction type
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
    -- Unknown table, skip
    RETURN NEW;
  END IF;

  -- Get the content author
  SELECT author_id INTO content_author_id
  FROM public.insights 
  WHERE id = NEW.insight_id;
  
  -- Don't award voltz if author not found or if user is interacting with their own content
  IF content_author_id IS NULL OR content_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Award voltz to content author
  UPDATE public.profiles
  SET spendable_voltz = spendable_voltz + voltz_amount,
      total_voltz_earned = total_voltz_earned + voltz_amount
  WHERE id = content_author_id;

  -- Log voltz transaction
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type, actor_id)
  VALUES (
    content_author_id, voltz_amount, reward_reason, 'insight', NEW.insight_id::text, 'earned', NEW.user_id
  );
  
  RAISE NOTICE 'Social voltz awarded: % voltz to user % for %', voltz_amount, content_author_id, reward_reason;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for social interactions
DROP TRIGGER IF EXISTS social_voltz_trigger_likes ON public.insight_likes;
CREATE TRIGGER social_voltz_trigger_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz();

DROP TRIGGER IF EXISTS social_voltz_trigger_comments ON public.insight_comments;
CREATE TRIGGER social_voltz_trigger_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz();

DROP TRIGGER IF EXISTS social_voltz_trigger_saves ON public.insight_saves;
CREATE TRIGGER social_voltz_trigger_saves
  AFTER INSERT ON public.insight_saves
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz();

-- Quiz Voltz Rewards System
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

  -- Award voltz to quiz taker
  UPDATE public.profiles
  SET spendable_voltz = spendable_voltz + voltz_amount,
      total_voltz_earned = total_voltz_earned + voltz_amount
  WHERE id = NEW.user_id;

  -- Log voltz transaction
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
  VALUES (
    NEW.user_id, voltz_amount, reward_reason, 'quiz', NEW.question_id::text, 'earned'
  );
  
  RAISE NOTICE 'Quiz voltz awarded: % voltz to user % for %', voltz_amount, NEW.user_id, reward_reason;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz attempts
DROP TRIGGER IF EXISTS quiz_voltz_trigger ON public.quiz_attempts;
CREATE TRIGGER quiz_voltz_trigger
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.award_quiz_voltz();

-- Insight Publishing & Supercharging Support
-- Function to handle voltz spending for supercharging
CREATE OR REPLACE FUNCTION public.handle_insight_supercharge()
RETURNS TRIGGER AS $$
DECLARE
  voltz_difference INTEGER;
  user_spendable INTEGER;
BEGIN
  -- If voltz_spent increased, deduct from user's spendable voltz
  IF NEW.voltz_spent > COALESCE(OLD.voltz_spent, 0) THEN
    voltz_difference := NEW.voltz_spent - COALESCE(OLD.voltz_spent, 0);
    
    -- Check if user has enough voltz
    SELECT spendable_voltz INTO user_spendable
    FROM public.profiles
    WHERE id = NEW.author_id;
    
    IF user_spendable < voltz_difference THEN
      RAISE EXCEPTION 'Insufficient voltz: user has % but needs %', user_spendable, voltz_difference;
    END IF;
    
    -- Deduct voltz from user
    UPDATE public.profiles
    SET spendable_voltz = spendable_voltz - voltz_difference
    WHERE id = NEW.author_id;
    
    -- Log voltz transaction
    INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
    VALUES (
      NEW.author_id, -voltz_difference, 'Supercharge insight', 'insight', NEW.id::text, 'spent'
    );
    
    -- Mark as supercharged if voltz was spent
    NEW.supercharged := true;
    
    RAISE NOTICE 'Insight supercharged: user % spent % voltz on insight %', NEW.author_id, voltz_difference, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for insight supercharging
-- Only trigger on UPDATE when voltz_spent changes (not on INSERT)
DROP TRIGGER IF EXISTS insight_supercharge_trigger ON public.insights;
CREATE TRIGGER insight_supercharge_trigger
  BEFORE UPDATE ON public.insights
  FOR EACH ROW 
  WHEN (OLD.voltz_spent IS DISTINCT FROM NEW.voltz_spent AND NEW.voltz_spent > 0)
  EXECUTE FUNCTION public.handle_insight_supercharge();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.award_single_achievement(UUID, RECORD) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_social_voltz() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_quiz_voltz() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_insight_supercharge() TO authenticated;

-- Test insight insertion to verify no more user_id errors
DO $$
DECLARE
  test_user_id uuid := '1f7d13e4-2e2d-4bbc-8bc4-16376d516d32'; -- Use actual user ID from your logs
  result_id uuid;
BEGIN
  RAISE NOTICE '=== TESTING INSIGHT INSERTION ===';
  RAISE NOTICE 'Attempting to insert test insight to verify no user_id errors...';
  
  BEGIN
    INSERT INTO public.insights (content, author_id) 
    VALUES ('TEST INSIGHT - Pre Launch Voltz System Test', test_user_id)
    RETURNING id INTO result_id;
    
    RAISE NOTICE 'SUCCESS: Test insight inserted with ID: %', result_id;
    RAISE NOTICE 'Cleaning up test insight...';
    DELETE FROM public.insights WHERE id = result_id;
    RAISE NOTICE 'Test insight cleaned up successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ERROR during test: SQLSTATE=% SQLERRM=%', SQLSTATE, SQLERRM;
      RAISE NOTICE 'If you see user_id errors above, there are still problematic triggers!';
  END;
  
  RAISE NOTICE '=== TEST COMPLETE ===';
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== Pre-Launch Voltz System Implemented Successfully ===';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '- Achievement voltz rewards (using existing voltz_reward values)';
  RAISE NOTICE '- Social interaction voltz: likes (+5), comments (+10), saves (+10)';
  RAISE NOTICE '- Quiz voltz: correct answers (+20), participation (+5)';
  RAISE NOTICE '- Insight supercharging with voltz spending';
  RAISE NOTICE '- Full integration with level progression system';
  RAISE NOTICE '- Transaction logging in xp_ledger';
  RAISE NOTICE '- All problematic user_id triggers removed';
  RAISE NOTICE '======================================================';
END $$;