-- Comprehensive Achievement System - Fixed for Real Database Structure
-- Run this after debugging to see the actual data structure

-- Enhanced function that checks user_content_interactions table
CREATE OR REPLACE FUNCTION public.check_user_eligibility_fixed(target_user_id UUID)
RETURNS TABLE(achievement_name TEXT, eligible BOOLEAN, already_has BOOLEAN, user_stat_value INT, required_value INT, debug_info TEXT) AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  user_stats RECORD;
BEGIN
  -- Get comprehensive user statistics from multiple tables
  SELECT 
    COALESCE(p.profile_completion_percentage, 0) as profile_completion,
    
    -- Content publishing
    (SELECT COUNT(*) FROM public.insights WHERE author_id = target_user_id) as insights_published,
    
    -- Direct like tables
    (SELECT COUNT(*) FROM public.insight_likes WHERE user_id = target_user_id) as insight_likes_given,
    (SELECT COUNT(*) FROM public.article_likes WHERE user_id = target_user_id) as article_likes_given,
    (SELECT COUNT(*) FROM public.paper_likes WHERE user_id = target_user_id) as paper_likes_given,
    (SELECT COUNT(*) FROM public.book_likes WHERE user_id = target_user_id) as book_likes_given,
    
    -- Comments
    (SELECT COUNT(*) FROM public.insight_comments WHERE user_id = target_user_id) as insight_comments_made,
    (SELECT COUNT(*) FROM public.comments WHERE user_id = target_user_id) as article_comments_made,
    (SELECT COUNT(*) FROM public.paper_comments WHERE user_id = target_user_id) as paper_comments_made,
    (SELECT COUNT(*) FROM public.book_comments WHERE user_id = target_user_id) as book_comments_made,
    
    -- Quiz attempts
    (SELECT COUNT(*) FROM public.quiz_attempts WHERE user_id = target_user_id) as quizzes_completed,
    
    -- Likes received on insights
    (SELECT COUNT(*) FROM public.insight_likes il 
     JOIN public.insights i ON il.insight_id = i.id 
     WHERE i.author_id = target_user_id) as likes_received_insights,
     
    -- User content interactions (main interaction tracking table)
    (SELECT COUNT(*) FROM public.user_content_interactions 
     WHERE user_id = target_user_id AND 'like' = ANY(interaction_types)) as interactions_with_likes,
    
    (SELECT COUNT(*) FROM public.user_content_interactions 
     WHERE user_id = target_user_id AND 'comment' = ANY(interaction_types)) as interactions_with_comments,
     
    -- Total interactions across all content types
    (SELECT COUNT(DISTINCT content_id) FROM public.user_content_interactions 
     WHERE user_id = target_user_id) as total_content_interacted
    
  INTO user_stats
  FROM public.profiles p
  WHERE p.id = target_user_id;
  
  -- Debug: Check if we got the user record
  IF NOT FOUND THEN
    achievement_name := 'DEBUG';
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
    
    -- Check eligibility based on criteria - using comprehensive stats
    IF achievement_record.criteria->>'action' = 'first_insight' THEN
      eligible := user_stats.insights_published >= 1;
      user_stat_value := user_stats.insights_published;
      required_value := 1;
      debug_info := 'insights_published: ' || user_stats.insights_published;
      
    ELSIF achievement_record.criteria->>'action' = 'first_like_given' THEN
      -- Check multiple sources for likes
      user_stat_value := user_stats.insight_likes_given + user_stats.article_likes_given + 
                        user_stats.paper_likes_given + user_stats.book_likes_given + 
                        user_stats.interactions_with_likes;
      eligible := user_stat_value >= 1;
      required_value := 1;
      debug_info := 'total_likes: insight(' || user_stats.insight_likes_given || 
                   ') + article(' || user_stats.article_likes_given ||
                   ') + paper(' || user_stats.paper_likes_given ||
                   ') + book(' || user_stats.book_likes_given ||
                   ') + interactions(' || user_stats.interactions_with_likes || ')';
      
    ELSIF achievement_record.criteria->>'action' = 'first_comment' THEN
      user_stat_value := user_stats.insight_comments_made + user_stats.article_comments_made + 
                        user_stats.paper_comments_made + user_stats.book_comments_made +
                        user_stats.interactions_with_comments;
      eligible := user_stat_value >= 1;
      required_value := 1;
      debug_info := 'total_comments: ' || user_stat_value;
      
    ELSIF achievement_record.criteria->>'action' = 'first_like_received' THEN
      eligible := user_stats.likes_received_insights >= 1;
      user_stat_value := user_stats.likes_received_insights;
      required_value := 1;
      debug_info := 'likes_received_insights: ' || user_stats.likes_received_insights;
      
    ELSIF achievement_record.criteria->>'action' = 'first_quiz' THEN
      eligible := user_stats.quizzes_completed >= 1;
      user_stat_value := user_stats.quizzes_completed;
      required_value := 1;
      debug_info := 'quizzes_completed: ' || user_stats.quizzes_completed;
      
    ELSIF achievement_record.criteria->>'action' = 'profile_completion' THEN
      required_value := (achievement_record.criteria->>'percentage')::int;
      eligible := user_stats.profile_completion >= required_value;
      user_stat_value := user_stats.profile_completion;
      debug_info := 'profile_completion: ' || user_stats.profile_completion || '% (need ' || required_value || '%)';
      
    -- Handle achievements with target counts
    ELSIF achievement_record.criteria->>'action' = 'insights_published' THEN
      required_value := (achievement_record.criteria->>'target')::int;
      eligible := user_stats.insights_published >= required_value;
      user_stat_value := user_stats.insights_published;
      debug_info := 'insights_published: ' || user_stats.insights_published;
      
    ELSIF achievement_record.criteria->>'action' = 'likes_given' THEN
      required_value := (achievement_record.criteria->>'target')::int;
      user_stat_value := user_stats.insight_likes_given + user_stats.article_likes_given + 
                        user_stats.paper_likes_given + user_stats.book_likes_given + 
                        user_stats.interactions_with_likes;
      eligible := user_stat_value >= required_value;
      debug_info := 'total_likes_given: ' || user_stat_value;
      
    ELSIF achievement_record.criteria->>'action' = 'comments_made' THEN
      required_value := (achievement_record.criteria->>'target')::int;
      user_stat_value := user_stats.insight_comments_made + user_stats.article_comments_made + 
                        user_stats.paper_comments_made + user_stats.book_comments_made +
                        user_stats.interactions_with_comments;
      eligible := user_stat_value >= required_value;
      debug_info := 'total_comments_made: ' || user_stat_value;
      
    ELSIF achievement_record.criteria->>'action' = 'total_likes_received' THEN
      required_value := (achievement_record.criteria->>'target')::int;
      eligible := user_stats.likes_received_insights >= required_value;
      user_stat_value := user_stats.likes_received_insights;
      debug_info := 'likes_received: ' || user_stats.likes_received_insights;
      
    ELSIF achievement_record.criteria->>'action' = 'quizzes_completed' THEN
      required_value := (achievement_record.criteria->>'target')::int;
      eligible := user_stats.quizzes_completed >= required_value;
      user_stat_value := user_stats.quizzes_completed;
      debug_info := 'quizzes_completed: ' || user_stats.quizzes_completed;
      
    ELSE
      eligible := FALSE;
      user_stat_value := 0;
      required_value := 0;
      debug_info := 'Unknown criteria: ' || achievement_record.criteria->>'action';
    END IF;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Updated trigger function that works with user_content_interactions
CREATE OR REPLACE FUNCTION public.award_achievements_fixed()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  target_user_id UUID;
  total_likes_given INT;
  total_comments_made INT;
BEGIN
  -- Determine the user ID from the trigger context
  target_user_id := COALESCE(NEW.user_id, NEW.author_id, NEW.id);
  
  -- Skip if we can't determine user ID
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get current user stats for achievements that need counts
  SELECT 
    (SELECT COUNT(*) FROM public.insight_likes WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM public.article_likes WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM public.paper_likes WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM public.book_likes WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM public.user_content_interactions 
     WHERE user_id = target_user_id AND 'like' = ANY(interaction_types)) INTO total_likes_given;
     
  SELECT 
    (SELECT COUNT(*) FROM public.insight_comments WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM public.comments WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM public.paper_comments WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM public.book_comments WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM public.user_content_interactions 
     WHERE user_id = target_user_id AND 'comment' = ANY(interaction_types)) INTO total_comments_made;
  
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
      PERFORM public.award_single_achievement(target_user_id, achievement_record);
      
    ELSIF achievement_record.criteria->>'action' = 'first_like_given' THEN
      IF TG_TABLE_NAME IN ('insight_likes', 'article_likes', 'paper_likes', 'book_likes', 'user_content_interactions') THEN
        PERFORM public.award_single_achievement(target_user_id, achievement_record);
      END IF;
      
    ELSIF achievement_record.criteria->>'action' = 'first_comment' THEN
      IF TG_TABLE_NAME IN ('insight_comments', 'comments', 'paper_comments', 'book_comments', 'user_content_interactions') THEN
        PERFORM public.award_single_achievement(target_user_id, achievement_record);
      END IF;
      
    ELSIF achievement_record.criteria->>'action' = 'first_quiz' AND TG_TABLE_NAME = 'quiz_attempts' THEN
      PERFORM public.award_single_achievement(target_user_id, achievement_record);
      
    ELSIF achievement_record.criteria->>'action' = 'first_supercharge' AND TG_TABLE_NAME = 'insights' AND NEW.voltz_spent > 0 THEN
      PERFORM public.award_single_achievement(target_user_id, achievement_record);
      
    ELSIF achievement_record.criteria->>'action' = 'profile_completion' AND TG_TABLE_NAME = 'profiles' THEN
      IF NEW.profile_completion_percentage >= (achievement_record.criteria->>'percentage')::int THEN
        PERFORM public.award_single_achievement(target_user_id, achievement_record);
      END IF;
      
    ELSIF achievement_record.criteria->>'action' = 'first_like_received' THEN
      IF TG_TABLE_NAME = 'insight_likes' THEN
        IF EXISTS(SELECT 1 FROM public.insights WHERE id = NEW.insight_id AND author_id = target_user_id) THEN
          PERFORM public.award_single_achievement(target_user_id, achievement_record);
        END IF;
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

-- Create trigger for user_content_interactions table
DROP TRIGGER IF EXISTS achievement_trigger_content_interactions ON public.user_content_interactions;
CREATE TRIGGER achievement_trigger_content_interactions
  AFTER INSERT ON public.user_content_interactions
  FOR EACH ROW EXECUTE FUNCTION public.award_achievements_fixed();