-- Final Simple Achievement System - No nested blocks
-- Run this after confirming which tables have data

-- Clean function to check user eligibility using actual tables
CREATE OR REPLACE FUNCTION public.check_user_eligibility_final(target_user_id UUID)
RETURNS TABLE(achievement_name TEXT, eligible BOOLEAN, already_has BOOLEAN, user_stat_value INT, required_value INT, debug_info TEXT) AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  user_stats RECORD;
  action_value TEXT;
BEGIN
  -- Get user statistics from individual tables only
  SELECT 
    COALESCE(p.profile_completion_percentage, 0) as profile_completion,
    
    -- Content publishing
    (SELECT COUNT(*) FROM public.insights WHERE author_id = target_user_id) as insights_published,
    
    -- Likes given (individual tables)
    (SELECT COUNT(*) FROM public.insight_likes WHERE user_id = target_user_id) as insight_likes_given,
    (SELECT COUNT(*) FROM public.article_likes WHERE user_id = target_user_id) as article_likes_given,
    (SELECT COUNT(*) FROM public.paper_likes WHERE user_id = target_user_id) as paper_likes_given,
    (SELECT COUNT(*) FROM public.book_likes WHERE user_id = target_user_id) as book_likes_given,
    
    -- Comments made (individual tables)
    (SELECT COUNT(*) FROM public.insight_comments WHERE user_id = target_user_id) as insight_comments_made,
    (SELECT COUNT(*) FROM public.comments WHERE user_id = target_user_id) as article_comments_made,
    (SELECT COUNT(*) FROM public.paper_comments WHERE user_id = target_user_id) as paper_comments_made,
    (SELECT COUNT(*) FROM public.book_comments WHERE user_id = target_user_id) as book_comments_made,
    
    -- Quiz attempts
    (SELECT COUNT(*) FROM public.quiz_attempts WHERE user_id = target_user_id) as quizzes_completed,
    
    -- Likes received on insights
    (SELECT COUNT(*) FROM public.insight_likes il 
     JOIN public.insights i ON il.insight_id = i.id 
     WHERE i.author_id = target_user_id) as likes_received_insights
    
  INTO user_stats
  FROM public.profiles p
  WHERE p.id = target_user_id;
  
  -- Check if we found the user
  IF NOT FOUND THEN
    achievement_name := 'ERROR';
    eligible := FALSE;
    already_has := FALSE;
    user_stat_value := 0;
    required_value := 0;
    debug_info := 'User not found in profiles table';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check each achievement
  FOR achievement_record IN 
    SELECT * FROM public.achievements WHERE is_active = true ORDER BY name
  LOOP
    -- Check if user already has this achievement
    SELECT EXISTS(
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = target_user_id 
      AND achievement_id = achievement_record.id
    ) INTO user_achievement_exists;
    
    achievement_name := achievement_record.name;
    already_has := user_achievement_exists;
    debug_info := '';
    
    -- Get the action from criteria safely
    BEGIN
      action_value := achievement_record.criteria->>'action';
    EXCEPTION WHEN OTHERS THEN
      action_value := 'unknown';
    END;
    
    -- Check eligibility based on criteria
    IF action_value = 'first_insight' THEN
      eligible := user_stats.insights_published >= 1;
      user_stat_value := user_stats.insights_published;
      required_value := 1;
      debug_info := 'insights published: ' || user_stats.insights_published;
      
    ELSIF action_value = 'first_like_given' THEN
      user_stat_value := user_stats.insight_likes_given + user_stats.article_likes_given + 
                        user_stats.paper_likes_given + user_stats.book_likes_given;
      eligible := user_stat_value >= 1;
      required_value := 1;
      debug_info := 'total likes: insight(' || user_stats.insight_likes_given || 
                   ') + article(' || user_stats.article_likes_given ||
                   ') + paper(' || user_stats.paper_likes_given ||
                   ') + book(' || user_stats.book_likes_given || ') = ' || user_stat_value;
      
    ELSIF action_value = 'first_comment' THEN
      user_stat_value := user_stats.insight_comments_made + user_stats.article_comments_made + 
                        user_stats.paper_comments_made + user_stats.book_comments_made;
      eligible := user_stat_value >= 1;
      required_value := 1;
      debug_info := 'total comments: ' || user_stat_value;
      
    ELSIF action_value = 'first_like_received' THEN
      eligible := user_stats.likes_received_insights >= 1;
      user_stat_value := user_stats.likes_received_insights;
      required_value := 1;
      debug_info := 'likes received on insights: ' || user_stats.likes_received_insights;
      
    ELSIF action_value = 'first_quiz' THEN
      eligible := user_stats.quizzes_completed >= 1;
      user_stat_value := user_stats.quizzes_completed;
      required_value := 1;
      debug_info := 'quizzes completed: ' || user_stats.quizzes_completed;
      
    ELSIF action_value = 'profile_completion' THEN
      BEGIN
        required_value := (achievement_record.criteria->>'percentage')::int;
      EXCEPTION WHEN OTHERS THEN
        required_value := 100;
      END;
      eligible := user_stats.profile_completion >= required_value;
      user_stat_value := user_stats.profile_completion;
      debug_info := 'profile completion: ' || user_stats.profile_completion || '% (need ' || required_value || '%)';
      
    -- Handle achievements with target counts
    ELSIF action_value = 'insights_published' THEN
      BEGIN
        required_value := (achievement_record.criteria->>'target')::int;
      EXCEPTION WHEN OTHERS THEN
        required_value := 0;
      END;
      eligible := user_stats.insights_published >= required_value;
      user_stat_value := user_stats.insights_published;
      debug_info := 'insights published: ' || user_stats.insights_published || ' (need ' || required_value || ')';
      
    ELSIF action_value = 'likes_given' THEN
      user_stat_value := user_stats.insight_likes_given + user_stats.article_likes_given + 
                        user_stats.paper_likes_given + user_stats.book_likes_given;
      BEGIN
        required_value := (achievement_record.criteria->>'target')::int;
      EXCEPTION WHEN OTHERS THEN
        required_value := 0;
      END;
      eligible := user_stat_value >= required_value;
      debug_info := 'total likes given: ' || user_stat_value || ' (need ' || required_value || ')';
      
    ELSIF action_value = 'comments_made' THEN
      user_stat_value := user_stats.insight_comments_made + user_stats.article_comments_made + 
                        user_stats.paper_comments_made + user_stats.book_comments_made;
      BEGIN
        required_value := (achievement_record.criteria->>'target')::int;
      EXCEPTION WHEN OTHERS THEN
        required_value := 0;
      END;
      eligible := user_stat_value >= required_value;
      debug_info := 'total comments made: ' || user_stat_value || ' (need ' || required_value || ')';
      
    ELSIF action_value = 'total_likes_received' THEN
      BEGIN
        required_value := (achievement_record.criteria->>'target')::int;
      EXCEPTION WHEN OTHERS THEN
        required_value := 0;
      END;
      eligible := user_stats.likes_received_insights >= required_value;
      user_stat_value := user_stats.likes_received_insights;
      debug_info := 'likes received: ' || user_stats.likes_received_insights || ' (need ' || required_value || ')';
      
    ELSIF action_value = 'quizzes_completed' THEN
      BEGIN
        required_value := (achievement_record.criteria->>'target')::int;
      EXCEPTION WHEN OTHERS THEN
        required_value := 0;
      END;
      eligible := user_stats.quizzes_completed >= required_value;
      user_stat_value := user_stats.quizzes_completed;
      debug_info := 'quizzes completed: ' || user_stats.quizzes_completed || ' (need ' || required_value || ')';
      
    ELSE
      eligible := FALSE;
      user_stat_value := 0;
      required_value := 0;
      debug_info := 'Unknown criteria: ' || COALESCE(action_value, 'NULL');
    END IF;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Simple trigger function for real-time awarding
CREATE OR REPLACE FUNCTION public.award_achievements_simple()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  target_user_id UUID;
  action_value TEXT;
BEGIN
  -- Determine the user ID from the trigger context
  target_user_id := COALESCE(NEW.user_id, NEW.author_id, NEW.id);
  
  -- Skip if we can't determine user ID
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check for achievements based on the current trigger
  FOR achievement_record IN 
    SELECT * FROM public.achievements WHERE is_active = true 
  LOOP
    -- Check if user already has this achievement
    SELECT EXISTS(
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = target_user_id 
      AND achievement_id = achievement_record.id
    ) INTO user_achievement_exists;
    
    -- Skip if user already has achievement
    IF user_achievement_exists THEN
      CONTINUE;
    END IF;
    
    -- Get action safely
    BEGIN
      action_value := achievement_record.criteria->>'action';
    EXCEPTION WHEN OTHERS THEN
      CONTINUE; -- Skip malformed achievements
    END;
    
    -- Check specific achievement criteria based on table and action
    IF action_value = 'first_insight' AND TG_TABLE_NAME = 'insights' THEN
      PERFORM public.award_single_achievement(target_user_id, achievement_record);
      
    ELSIF action_value = 'first_like_given' AND TG_TABLE_NAME IN ('insight_likes', 'article_likes', 'paper_likes', 'book_likes') THEN
      PERFORM public.award_single_achievement(target_user_id, achievement_record);
      
    ELSIF action_value = 'first_comment' AND TG_TABLE_NAME IN ('insight_comments', 'comments', 'paper_comments', 'book_comments') THEN
      PERFORM public.award_single_achievement(target_user_id, achievement_record);
      
    ELSIF action_value = 'first_quiz' AND TG_TABLE_NAME = 'quiz_attempts' THEN
      PERFORM public.award_single_achievement(target_user_id, achievement_record);
      
    ELSIF action_value = 'first_supercharge' AND TG_TABLE_NAME = 'insights' AND NEW.voltz_spent > 0 THEN
      PERFORM public.award_single_achievement(target_user_id, achievement_record);
      
    ELSIF action_value = 'profile_completion' AND TG_TABLE_NAME = 'profiles' THEN
      DECLARE
        required_percentage INT;
      BEGIN
        required_percentage := (achievement_record.criteria->>'percentage')::int;
        IF NEW.profile_completion_percentage >= required_percentage THEN
          PERFORM public.award_single_achievement(target_user_id, achievement_record);
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Skip if criteria malformed
        CONTINUE;
      END;
      
    ELSIF action_value = 'first_like_received' AND TG_TABLE_NAME = 'insight_likes' THEN
      -- Check if this like is for content authored by the target user
      IF EXISTS(SELECT 1 FROM public.insights WHERE id = NEW.insight_id AND author_id = target_user_id) THEN
        PERFORM public.award_single_achievement(target_user_id, achievement_record);
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to award a single achievement
CREATE OR REPLACE FUNCTION public.award_single_achievement(target_user_id UUID, achievement_record RECORD)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_achievements (
    user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
  ) VALUES (
    target_user_id, achievement_record.id, achievement_record.category,
    achievement_record.name, achievement_record.description, achievement_record.icon_name, NOW()
  );
  
  UPDATE public.profiles 
  SET spendable_voltz = spendable_voltz + achievement_record.voltz_reward,
      total_voltz_earned = total_voltz_earned + achievement_record.voltz_reward
  WHERE id = target_user_id;
  
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
  VALUES (
    target_user_id, achievement_record.voltz_reward,
    'Achievement: ' || achievement_record.name, 'achievement', achievement_record.id::text, 'earned'
  );
  
  RAISE NOTICE 'Achievement awarded: % to user % (% voltz)', achievement_record.name, target_user_id, achievement_record.voltz_reward;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for existing tables only
DROP TRIGGER IF EXISTS achievement_trigger_insights ON public.insights;
CREATE TRIGGER achievement_trigger_insights
  AFTER INSERT ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

DROP TRIGGER IF EXISTS achievement_trigger_insight_likes ON public.insight_likes;
CREATE TRIGGER achievement_trigger_insight_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

DROP TRIGGER IF EXISTS achievement_trigger_article_likes ON public.article_likes;
CREATE TRIGGER achievement_trigger_article_likes
  AFTER INSERT ON public.article_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

DROP TRIGGER IF EXISTS achievement_trigger_paper_likes ON public.paper_likes;
CREATE TRIGGER achievement_trigger_paper_likes
  AFTER INSERT ON public.paper_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

DROP TRIGGER IF EXISTS achievement_trigger_book_likes ON public.book_likes;
CREATE TRIGGER achievement_trigger_book_likes
  AFTER INSERT ON public.book_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

DROP TRIGGER IF EXISTS achievement_trigger_insight_comments ON public.insight_comments;
CREATE TRIGGER achievement_trigger_insight_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

DROP TRIGGER IF EXISTS achievement_trigger_comments ON public.comments;
CREATE TRIGGER achievement_trigger_comments
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

DROP TRIGGER IF EXISTS achievement_trigger_paper_comments ON public.paper_comments;
CREATE TRIGGER achievement_trigger_paper_comments
  AFTER INSERT ON public.paper_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

DROP TRIGGER IF EXISTS achievement_trigger_book_comments ON public.book_comments;
CREATE TRIGGER achievement_trigger_book_comments
  AFTER INSERT ON public.book_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

DROP TRIGGER IF EXISTS achievement_trigger_quiz_attempts ON public.quiz_attempts;
CREATE TRIGGER achievement_trigger_quiz_attempts
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

DROP TRIGGER IF EXISTS achievement_trigger_profiles ON public.profiles;
CREATE TRIGGER achievement_trigger_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW 
  WHEN (OLD.profile_completion_percentage IS DISTINCT FROM NEW.profile_completion_percentage)
  EXECUTE FUNCTION public.award_achievements_simple();