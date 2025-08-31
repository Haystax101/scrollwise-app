-- Achievement System SQL - Using Only Existing Tables
-- Run this after populating the achievements table

-- Enhanced function to check and award achievements (existing tables only)
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  achievement_met BOOLEAN;
  target_user_id UUID;
  user_stats RECORD;
BEGIN
  -- Determine the user ID from the trigger context
  target_user_id := COALESCE(NEW.user_id, NEW.author_id, NEW.id);
  
  -- Skip if we can't determine user ID
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get user statistics for complex achievements
  SELECT 
    -- Profile completion
    COALESCE(p.profile_completion_percentage, 0) as profile_completion,
    
    -- Content stats
    (SELECT COUNT(*) FROM public.insights WHERE author_id = target_user_id) as insights_published,
    (SELECT COUNT(*) FROM public.insight_likes WHERE user_id = target_user_id) as likes_given,
    (SELECT COUNT(*) FROM public.insight_comments WHERE user_id = target_user_id) as comments_made,
    
    -- Quiz stats
    (SELECT COUNT(*) FROM public.quiz_attempts WHERE user_id = target_user_id) as quizzes_completed,
    (SELECT COALESCE(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100, 0) 
     FROM public.quiz_attempts WHERE user_id = target_user_id) as quiz_accuracy,
    
    -- Engagement received stats
    (SELECT COUNT(*) FROM public.insight_likes il 
     JOIN public.insights i ON il.insight_id = i.id 
     WHERE i.author_id = target_user_id) as likes_received,
    (SELECT COUNT(*) FROM public.insight_comments ic 
     JOIN public.insights i ON ic.insight_id = i.id 
     WHERE i.author_id = target_user_id) as comments_received,
    (SELECT COUNT(*) FROM public.insight_saves isv 
     JOIN public.insights i ON isv.insight_id = i.id 
     WHERE i.author_id = target_user_id) as saves_received,
     
    -- Streak stats (from existing profiles table)
    COALESCE(p.days_streak, 0) as current_login_streak
    
  INTO user_stats
  FROM public.profiles p
  WHERE p.id = target_user_id;
  
  -- Loop through all active achievements to check criteria
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
    
    -- Check achievement criteria based on the action
    achievement_met := FALSE;
    
    CASE achievement_record.criteria->>'action'
      -- Content publishing achievements
      WHEN 'first_insight' THEN
        IF TG_TABLE_NAME = 'insights' THEN
          achievement_met := TRUE;
        END IF;
        
      WHEN 'insights_published' THEN
        achievement_met := user_stats.insights_published >= (achievement_record.criteria->>'target')::int;
        
      -- Social interaction achievements (giving)
      WHEN 'first_like_given' THEN
        IF TG_TABLE_NAME IN ('insight_likes', 'article_likes', 'paper_likes', 'book_likes') THEN
          achievement_met := TRUE;
        END IF;
        
      WHEN 'likes_given' THEN
        achievement_met := user_stats.likes_given >= (achievement_record.criteria->>'target')::int;
        
      WHEN 'first_comment' THEN
        IF TG_TABLE_NAME IN ('insight_comments', 'comments', 'paper_comments', 'book_comments') THEN
          achievement_met := TRUE;
        END IF;
        
      WHEN 'comments_made' THEN
        achievement_met := user_stats.comments_made >= (achievement_record.criteria->>'target')::int;
        
      -- Social interaction achievements (receiving)
      WHEN 'first_like_received' THEN
        IF TG_TABLE_NAME = 'insight_likes' THEN
          -- Check if this like is for content authored by the target user
          IF EXISTS(SELECT 1 FROM public.insights WHERE id = NEW.insight_id AND author_id = target_user_id) THEN
            achievement_met := TRUE;
          END IF;
        ELSIF TG_TABLE_NAME = 'article_likes' THEN
          achievement_met := user_stats.likes_received >= 1;
        ELSIF TG_TABLE_NAME = 'paper_likes' THEN
          achievement_met := user_stats.likes_received >= 1;
        ELSIF TG_TABLE_NAME = 'book_likes' THEN
          achievement_met := user_stats.likes_received >= 1;
        END IF;
        
      WHEN 'total_likes_received' THEN
        achievement_met := user_stats.likes_received >= (achievement_record.criteria->>'target')::int;
        
      -- Quiz achievements
      WHEN 'first_quiz' THEN
        IF TG_TABLE_NAME = 'quiz_attempts' THEN
          achievement_met := TRUE;
        END IF;
        
      WHEN 'quizzes_completed' THEN
        achievement_met := user_stats.quizzes_completed >= (achievement_record.criteria->>'target')::int;
        
      WHEN 'quiz_accuracy' THEN
        achievement_met := user_stats.quizzes_completed >= COALESCE((achievement_record.criteria->>'minimum_quizzes')::int, 20) 
                          AND user_stats.quiz_accuracy >= (achievement_record.criteria->>'percentage')::int;
        
      -- Profile completion achievements
      WHEN 'profile_completion' THEN
        achievement_met := user_stats.profile_completion >= (achievement_record.criteria->>'percentage')::int;
        
      -- Streak achievements (using existing days_streak from profiles)
      WHEN 'login_streak' THEN
        achievement_met := user_stats.current_login_streak >= (achievement_record.criteria->>'target')::int;
        
      -- Supercharging achievements
      WHEN 'first_supercharge' THEN
        IF TG_TABLE_NAME = 'insights' AND NEW.voltz_spent > 0 THEN
          achievement_met := TRUE;
        END IF;
        
      ELSE
        -- Unknown criteria, skip
        CONTINUE;
      END CASE;
      
      -- Award achievement if criteria met
      IF achievement_met THEN
        INSERT INTO public.user_achievements (
          user_id, 
          achievement_id,
          achievement_type,
          title,
          description,
          icon_name,
          earned_at
        ) VALUES (
          target_user_id,
          achievement_record.id,
          achievement_record.category,
          achievement_record.name,
          achievement_record.description,
          achievement_record.icon_name,
          NOW()
        );
        
        -- Award voltz
        UPDATE public.profiles 
        SET spendable_voltz = spendable_voltz + achievement_record.voltz_reward,
            total_voltz_earned = total_voltz_earned + achievement_record.voltz_reward
        WHERE id = target_user_id;
        
        -- Log voltz transaction
        INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
        VALUES (
          target_user_id,
          achievement_record.voltz_reward,
          'Achievement: ' || achievement_record.name,
          'achievement',
          achievement_record.id::text,
          'earned'
        );
        
        -- Log achievement for debugging
        RAISE NOTICE 'Achievement awarded: % to user %', achievement_record.name, target_user_id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all relevant existing tables
-- Content creation triggers
DROP TRIGGER IF EXISTS achievement_trigger_insights ON public.insights;
CREATE TRIGGER achievement_trigger_insights
  AFTER INSERT ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

-- Like triggers (all existing content types)
DROP TRIGGER IF EXISTS achievement_trigger_insight_likes ON public.insight_likes;
CREATE TRIGGER achievement_trigger_insight_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_article_likes ON public.article_likes;
CREATE TRIGGER achievement_trigger_article_likes
  AFTER INSERT ON public.article_likes
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_paper_likes ON public.paper_likes;
CREATE TRIGGER achievement_trigger_paper_likes
  AFTER INSERT ON public.paper_likes
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_book_likes ON public.book_likes;
CREATE TRIGGER achievement_trigger_book_likes
  AFTER INSERT ON public.book_likes
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

-- Comment triggers (all existing content types)
DROP TRIGGER IF EXISTS achievement_trigger_insight_comments ON public.insight_comments;
CREATE TRIGGER achievement_trigger_insight_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_comments ON public.comments;
CREATE TRIGGER achievement_trigger_comments
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_paper_comments ON public.paper_comments;
CREATE TRIGGER achievement_trigger_paper_comments
  AFTER INSERT ON public.paper_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_book_comments ON public.book_comments;
CREATE TRIGGER achievement_trigger_book_comments
  AFTER INSERT ON public.book_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

-- Quiz triggers
DROP TRIGGER IF EXISTS achievement_trigger_quiz_attempts ON public.quiz_attempts;
CREATE TRIGGER achievement_trigger_quiz_attempts
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

-- Profile update triggers
DROP TRIGGER IF EXISTS achievement_trigger_profiles ON public.profiles;
CREATE TRIGGER achievement_trigger_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

-- Function to manually check all achievements for a user (useful for retroactive awards)
CREATE OR REPLACE FUNCTION public.check_user_achievements_retroactive(target_user_id UUID)
RETURNS TABLE(achievement_name TEXT, should_have BOOLEAN, currently_has BOOLEAN) AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  achievement_met BOOLEAN;
  user_stats RECORD;
BEGIN
  -- Get user statistics
  SELECT 
    COALESCE(p.profile_completion_percentage, 0) as profile_completion,
    (SELECT COUNT(*) FROM public.insights WHERE author_id = target_user_id) as insights_published,
    (SELECT COUNT(*) FROM public.insight_likes WHERE user_id = target_user_id) as likes_given,
    (SELECT COUNT(*) FROM public.insight_comments WHERE user_id = target_user_id) as comments_made,
    (SELECT COUNT(*) FROM public.quiz_attempts WHERE user_id = target_user_id) as quizzes_completed,
    (SELECT COALESCE(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100, 0) 
     FROM public.quiz_attempts WHERE user_id = target_user_id) as quiz_accuracy,
    (SELECT COUNT(*) FROM public.insight_likes il 
     JOIN public.insights i ON il.insight_id = i.id 
     WHERE i.author_id = target_user_id) as likes_received,
    COALESCE(p.days_streak, 0) as current_login_streak
  INTO user_stats
  FROM public.profiles p
  WHERE p.id = target_user_id;
  
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
    
    achievement_met := FALSE;
    
    -- Check if criteria should be met based on current stats
    CASE achievement_record.criteria->>'action'
      WHEN 'first_insight' THEN
        achievement_met := user_stats.insights_published >= 1;
      WHEN 'first_like_given' THEN
        achievement_met := user_stats.likes_given >= 1;
      WHEN 'first_comment' THEN
        achievement_met := user_stats.comments_made >= 1;
      WHEN 'first_like_received' THEN
        achievement_met := user_stats.likes_received >= 1;
      WHEN 'first_quiz' THEN
        achievement_met := user_stats.quizzes_completed >= 1;
      WHEN 'profile_completion' THEN
        achievement_met := user_stats.profile_completion >= (achievement_record.criteria->>'percentage')::int;
      WHEN 'login_streak' THEN
        achievement_met := user_stats.current_login_streak >= (achievement_record.criteria->>'target')::int;
      WHEN 'insights_published' THEN
        achievement_met := user_stats.insights_published >= (achievement_record.criteria->>'target')::int;
      WHEN 'likes_given' THEN
        achievement_met := user_stats.likes_given >= (achievement_record.criteria->>'target')::int;
      WHEN 'comments_made' THEN
        achievement_met := user_stats.comments_made >= (achievement_record.criteria->>'target')::int;
      WHEN 'total_likes_received' THEN
        achievement_met := user_stats.likes_received >= (achievement_record.criteria->>'target')::int;
      WHEN 'quizzes_completed' THEN
        achievement_met := user_stats.quizzes_completed >= (achievement_record.criteria->>'target')::int;
      WHEN 'quiz_accuracy' THEN
        achievement_met := user_stats.quizzes_completed >= COALESCE((achievement_record.criteria->>'minimum_quizzes')::int, 20) 
                          AND user_stats.quiz_accuracy >= (achievement_record.criteria->>'percentage')::int;
      ELSE
        achievement_met := FALSE;
    END CASE;
    
    -- Return result for this achievement
    achievement_name := achievement_record.name;
    should_have := achievement_met;
    currently_has := user_achievement_exists;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Simplified trigger function for real-time awarding
CREATE OR REPLACE FUNCTION public.award_achievements_simple()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  achievement_met BOOLEAN;
  target_user_id UUID;
BEGIN
  -- Determine the user ID from the trigger context
  target_user_id := COALESCE(NEW.user_id, NEW.author_id, NEW.id);
  
  -- Skip if we can't determine user ID
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check for simple "first time" achievements only
  FOR achievement_record IN 
    SELECT * FROM public.achievements 
    WHERE is_active = true 
    AND criteria->>'action' IN ('first_insight', 'first_like_given', 'first_comment', 'first_quiz', 'first_like_received', 'first_supercharge')
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
    
    -- Check simple criteria
    achievement_met := FALSE;
    
    CASE achievement_record.criteria->>'action'
      WHEN 'first_insight' THEN
        IF TG_TABLE_NAME = 'insights' THEN
          achievement_met := TRUE;
        END IF;
        
      WHEN 'first_like_given' THEN
        IF TG_TABLE_NAME IN ('insight_likes', 'article_likes', 'paper_likes', 'book_likes') THEN
          achievement_met := TRUE;
        END IF;
        
      WHEN 'first_comment' THEN
        IF TG_TABLE_NAME IN ('insight_comments', 'comments', 'paper_comments', 'book_comments') THEN
          achievement_met := TRUE;
        END IF;
        
      WHEN 'first_quiz' THEN
        IF TG_TABLE_NAME = 'quiz_attempts' THEN
          achievement_met := TRUE;
        END IF;
        
      WHEN 'first_like_received' THEN
        IF TG_TABLE_NAME = 'insight_likes' THEN
          -- Check if this like is for content authored by the target user
          IF EXISTS(SELECT 1 FROM public.insights WHERE id = NEW.insight_id AND author_id = target_user_id) THEN
            achievement_met := TRUE;
          END IF;
        END IF;
        
      WHEN 'first_supercharge' THEN
        IF TG_TABLE_NAME = 'insights' AND NEW.voltz_spent > 0 THEN
          achievement_met := TRUE;
        END IF;
    END CASE;
    
    -- Award achievement if criteria met
    IF achievement_met THEN
      INSERT INTO public.user_achievements (
        user_id, 
        achievement_id,
        achievement_type,
        title,
        description,
        icon_name,
        earned_at
      ) VALUES (
        target_user_id,
        achievement_record.id,
        achievement_record.category,
        achievement_record.name,
        achievement_record.description,
        achievement_record.icon_name,
        NOW()
      );
      
      -- Award voltz
      UPDATE public.profiles 
      SET spendable_voltz = spendable_voltz + achievement_record.voltz_reward,
          total_voltz_earned = total_voltz_earned + achievement_record.voltz_reward
      WHERE id = target_user_id;
      
      -- Log voltz transaction
      INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
      VALUES (
        target_user_id,
        achievement_record.voltz_reward,
        'Achievement: ' || achievement_record.name,
        'achievement',
        achievement_record.id::text,
        'earned'
      );
      
      -- Log achievement for debugging
      RAISE NOTICE 'Achievement awarded: % to user %', achievement_record.name, target_user_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
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

DROP TRIGGER IF EXISTS achievement_trigger_quiz_attempts ON public.quiz_attempts;
CREATE TRIGGER achievement_trigger_quiz_attempts
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_simple();

-- Profile completion trigger
DROP TRIGGER IF EXISTS achievement_trigger_profiles ON public.profiles;
CREATE TRIGGER achievement_trigger_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW 
  WHEN (OLD.profile_completion_percentage IS DISTINCT FROM NEW.profile_completion_percentage)
  EXECUTE FUNCTION public.award_achievements_simple();