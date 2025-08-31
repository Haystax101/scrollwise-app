-- Award Retroactive Achievements
-- Run this to award achievements for past actions

CREATE OR REPLACE FUNCTION public.award_retroactive_achievements(target_user_id UUID)
RETURNS TABLE(achievement_name TEXT, was_awarded BOOLEAN, voltz_awarded INT) AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  user_stats RECORD;
  action_value TEXT;
  should_award BOOLEAN;
  awarded_count INT := 0;
BEGIN
  -- Get user statistics
  SELECT 
    COALESCE(p.profile_completion_percentage, 0) as profile_completion,
    (SELECT COUNT(*) FROM public.insights WHERE author_id = target_user_id) as insights_published,
    (SELECT COUNT(*) FROM public.insight_likes WHERE user_id = target_user_id) as insight_likes_given,
    (SELECT COUNT(*) FROM public.article_likes WHERE user_id = target_user_id) as article_likes_given,
    (SELECT COUNT(*) FROM public.paper_likes WHERE user_id = target_user_id) as paper_likes_given,
    (SELECT COUNT(*) FROM public.book_likes WHERE user_id = target_user_id) as book_likes_given,
    (SELECT COUNT(*) FROM public.insight_comments WHERE user_id = target_user_id) as insight_comments_made,
    (SELECT COUNT(*) FROM public.comments WHERE user_id = target_user_id) as article_comments_made,
    (SELECT COUNT(*) FROM public.paper_comments WHERE user_id = target_user_id) as paper_comments_made,
    (SELECT COUNT(*) FROM public.book_comments WHERE user_id = target_user_id) as book_comments_made,
    (SELECT COUNT(*) FROM public.quiz_attempts WHERE user_id = target_user_id) as quizzes_completed,
    (SELECT COUNT(*) FROM public.insight_likes il 
     JOIN public.insights i ON il.insight_id = i.id 
     WHERE i.author_id = target_user_id) as likes_received_insights
  INTO user_stats
  FROM public.profiles p
  WHERE p.id = target_user_id;
  
  -- Check each achievement and award if eligible
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
    was_awarded := FALSE;
    voltz_awarded := 0;
    
    -- Skip if user already has achievement
    IF user_achievement_exists THEN
      RETURN NEXT;
      CONTINUE;
    END IF;
    
    -- Get action safely
    BEGIN
      action_value := achievement_record.criteria->>'action';
    EXCEPTION WHEN OTHERS THEN
      action_value := 'unknown';
    END;
    
    should_award := FALSE;
    
    -- Check if user should get this achievement based on current stats
    IF action_value = 'first_insight' THEN
      should_award := user_stats.insights_published >= 1;
      
    ELSIF action_value = 'first_like_given' THEN
      should_award := (user_stats.insight_likes_given + user_stats.article_likes_given + 
                      user_stats.paper_likes_given + user_stats.book_likes_given) >= 1;
      
    ELSIF action_value = 'first_comment' THEN
      should_award := (user_stats.insight_comments_made + user_stats.article_comments_made + 
                      user_stats.paper_comments_made + user_stats.book_comments_made) >= 1;
      
    ELSIF action_value = 'first_like_received' THEN
      should_award := user_stats.likes_received_insights >= 1;
      
    ELSIF action_value = 'first_quiz' THEN
      should_award := user_stats.quizzes_completed >= 1;
      
    ELSIF action_value = 'profile_completion' THEN
      DECLARE
        required_percentage INT;
      BEGIN
        required_percentage := (achievement_record.criteria->>'percentage')::int;
        should_award := user_stats.profile_completion >= required_percentage;
      EXCEPTION WHEN OTHERS THEN
        should_award := FALSE;
      END;
      
    -- Handle target-based achievements
    ELSIF action_value = 'insights_published' THEN
      DECLARE
        required_count INT;
      BEGIN
        required_count := (achievement_record.criteria->>'target')::int;
        should_award := user_stats.insights_published >= required_count;
      EXCEPTION WHEN OTHERS THEN
        should_award := FALSE;
      END;
      
    ELSIF action_value = 'likes_given' THEN
      DECLARE
        required_count INT;
        total_likes INT;
      BEGIN
        required_count := (achievement_record.criteria->>'target')::int;
        total_likes := user_stats.insight_likes_given + user_stats.article_likes_given + 
                      user_stats.paper_likes_given + user_stats.book_likes_given;
        should_award := total_likes >= required_count;
      EXCEPTION WHEN OTHERS THEN
        should_award := FALSE;
      END;
      
    ELSIF action_value = 'comments_made' THEN
      DECLARE
        required_count INT;
        total_comments INT;
      BEGIN
        required_count := (achievement_record.criteria->>'target')::int;
        total_comments := user_stats.insight_comments_made + user_stats.article_comments_made + 
                         user_stats.paper_comments_made + user_stats.book_comments_made;
        should_award := total_comments >= required_count;
      EXCEPTION WHEN OTHERS THEN
        should_award := FALSE;
      END;
      
    ELSIF action_value = 'total_likes_received' THEN
      DECLARE
        required_count INT;
      BEGIN
        required_count := (achievement_record.criteria->>'target')::int;
        should_award := user_stats.likes_received_insights >= required_count;
      EXCEPTION WHEN OTHERS THEN
        should_award := FALSE;
      END;
      
    ELSIF action_value = 'quizzes_completed' THEN
      DECLARE
        required_count INT;
      BEGIN
        required_count := (achievement_record.criteria->>'target')::int;
        should_award := user_stats.quizzes_completed >= required_count;
      EXCEPTION WHEN OTHERS THEN
        should_award := FALSE;
      END;
    END IF;
    
    -- Award the achievement if eligible
    IF should_award THEN
      BEGIN
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
        
        -- Log voltz transaction
        INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
        VALUES (
          target_user_id, achievement_record.voltz_reward,
          'Achievement (Retroactive): ' || achievement_record.name, 'achievement', achievement_record.id::text, 'earned'
        );
        
        was_awarded := TRUE;
        voltz_awarded := achievement_record.voltz_reward;
        awarded_count := awarded_count + 1;
        
        RAISE NOTICE 'Retroactive achievement awarded: % to user % (% voltz)', achievement_record.name, target_user_id, achievement_record.voltz_reward;
        
      EXCEPTION WHEN OTHERS THEN
        -- Skip if there's an error (e.g. duplicate key)
        was_awarded := FALSE;
        voltz_awarded := 0;
      END;
    END IF;
    
    RETURN NEXT;
  END LOOP;
  
  RAISE NOTICE 'Total retroactive achievements awarded: %', awarded_count;
END;
$$ LANGUAGE plpgsql;