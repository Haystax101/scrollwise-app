-- Fixed Achievement System SQL - Proper PostgreSQL Syntax
-- Run this after populating the achievements table

-- Simple trigger function for awarding achievements
CREATE OR REPLACE FUNCTION public.award_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  target_user_id UUID;
BEGIN
  -- Determine the user ID from the trigger context
  target_user_id := COALESCE(NEW.user_id, NEW.author_id, NEW.id);
  
  -- Skip if we can't determine user ID
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check for "first time" achievements
  FOR achievement_record IN 
    SELECT * FROM public.achievements 
    WHERE is_active = true 
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
    
    -- Check specific achievement criteria
    IF achievement_record.criteria->>'action' = 'first_insight' AND TG_TABLE_NAME = 'insights' THEN
      -- Award first insight achievement
      INSERT INTO public.user_achievements (
        user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
      ) VALUES (
        target_user_id, achievement_record.id, achievement_record.category,
        achievement_record.name, achievement_record.description, achievement_record.icon_name, NOW()
      );
      
      -- Award voltz
      UPDATE public.profiles 
      SET spendable_voltz = spendable_voltz + achievement_record.voltz_reward,
          total_voltz_earned = total_voltz_earned + achievement_record.voltz_reward
      WHERE id = target_user_id;
      
    ELSIF achievement_record.criteria->>'action' = 'first_like_given' AND TG_TABLE_NAME IN ('insight_likes', 'article_likes', 'paper_likes', 'book_likes') THEN
      -- Award first like given achievement
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
      
    ELSIF achievement_record.criteria->>'action' = 'first_comment' AND TG_TABLE_NAME IN ('insight_comments', 'comments', 'paper_comments', 'book_comments') THEN
      -- Award first comment achievement
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
      
    ELSIF achievement_record.criteria->>'action' = 'first_quiz' AND TG_TABLE_NAME = 'quiz_attempts' THEN
      -- Award first quiz achievement
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
      
    ELSIF achievement_record.criteria->>'action' = 'first_supercharge' AND TG_TABLE_NAME = 'insights' AND NEW.voltz_spent > 0 THEN
      -- Award first supercharge achievement
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
      
    ELSIF achievement_record.criteria->>'action' = 'profile_completion' AND TG_TABLE_NAME = 'profiles' THEN
      -- Check if profile is 100% complete
      IF NEW.profile_completion_percentage >= (achievement_record.criteria->>'percentage')::int THEN
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
      END IF;
      
    ELSIF achievement_record.criteria->>'action' = 'first_like_received' THEN
      -- Check if this is a like received on user's content
      IF TG_TABLE_NAME = 'insight_likes' THEN
        IF EXISTS(SELECT 1 FROM public.insights WHERE id = NEW.insight_id AND author_id = target_user_id) THEN
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
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for existing tables
DROP TRIGGER IF EXISTS achievement_trigger_insights ON public.insights;
CREATE TRIGGER achievement_trigger_insights
  AFTER INSERT ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_insight_likes ON public.insight_likes;
CREATE TRIGGER achievement_trigger_insight_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_article_likes ON public.article_likes;
CREATE TRIGGER achievement_trigger_article_likes
  AFTER INSERT ON public.article_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_paper_likes ON public.paper_likes;
CREATE TRIGGER achievement_trigger_paper_likes
  AFTER INSERT ON public.paper_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_book_likes ON public.book_likes;
CREATE TRIGGER achievement_trigger_book_likes
  AFTER INSERT ON public.book_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_insight_comments ON public.insight_comments;
CREATE TRIGGER achievement_trigger_insight_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_comments ON public.comments;
CREATE TRIGGER achievement_trigger_comments
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_quiz_attempts ON public.quiz_attempts;
CREATE TRIGGER achievement_trigger_quiz_attempts
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements();

DROP TRIGGER IF EXISTS achievement_trigger_profiles ON public.profiles;
CREATE TRIGGER achievement_trigger_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW 
  WHEN (OLD.profile_completion_percentage IS DISTINCT FROM NEW.profile_completion_percentage)
  EXECUTE FUNCTION public.award_achievements();

-- Function to manually check what achievements a user should have
CREATE OR REPLACE FUNCTION public.check_user_eligibility(target_user_id UUID)
RETURNS TABLE(achievement_name TEXT, eligible BOOLEAN, already_has BOOLEAN, user_stat_value INT, required_value INT) AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  user_stats RECORD;
BEGIN
  -- Get user statistics
  SELECT 
    COALESCE(p.profile_completion_percentage, 0) as profile_completion,
    (SELECT COUNT(*) FROM public.insights WHERE author_id = target_user_id) as insights_published,
    (SELECT COUNT(*) FROM public.insight_likes WHERE user_id = target_user_id) as likes_given,
    (SELECT COUNT(*) FROM public.insight_comments WHERE user_id = target_user_id) as comments_made,
    (SELECT COUNT(*) FROM public.quiz_attempts WHERE user_id = target_user_id) as quizzes_completed,
    (SELECT COUNT(*) FROM public.insight_likes il 
     JOIN public.insights i ON il.insight_id = i.id 
     WHERE i.author_id = target_user_id) as likes_received
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
    
    achievement_name := achievement_record.name;
    already_has := user_achievement_exists;
    
    -- Check eligibility based on criteria
    IF achievement_record.criteria->>'action' = 'first_insight' THEN
      eligible := user_stats.insights_published >= 1;
      user_stat_value := user_stats.insights_published;
      required_value := 1;
    ELSIF achievement_record.criteria->>'action' = 'first_like_given' THEN
      eligible := user_stats.likes_given >= 1;
      user_stat_value := user_stats.likes_given;
      required_value := 1;
    ELSIF achievement_record.criteria->>'action' = 'first_comment' THEN
      eligible := user_stats.comments_made >= 1;
      user_stat_value := user_stats.comments_made;
      required_value := 1;
    ELSIF achievement_record.criteria->>'action' = 'first_like_received' THEN
      eligible := user_stats.likes_received >= 1;
      user_stat_value := user_stats.likes_received;
      required_value := 1;
    ELSIF achievement_record.criteria->>'action' = 'first_quiz' THEN
      eligible := user_stats.quizzes_completed >= 1;
      user_stat_value := user_stats.quizzes_completed;
      required_value := 1;
    ELSIF achievement_record.criteria->>'action' = 'profile_completion' THEN
      eligible := user_stats.profile_completion >= (achievement_record.criteria->>'percentage')::int;
      user_stat_value := user_stats.profile_completion;
      required_value := (achievement_record.criteria->>'percentage')::int;
    ELSE
      eligible := FALSE;
      user_stat_value := 0;
      required_value := 0;
    END IF;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;