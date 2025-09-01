-- Fix Achievement Triggers System
-- This adds the missing triggers to award achievements automatically when users perform actions

-- 1. Create comprehensive achievement checking function
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(target_user_id UUID, action_type TEXT, context_data JSONB DEFAULT '{}')
RETURNS VOID AS $$
DECLARE
  achievement_record RECORD;
  user_stats RECORD;
BEGIN
  -- Get current user stats for achievement checking
  SELECT 
    COALESCE(profile.insights_count, 0) as insights_published,
    COALESCE(likes_given.count, 0) as likes_given,
    COALESCE(likes_received.count, 0) as likes_received,
    COALESCE(comments_made.count, 0) as comments_made,
    COALESCE(saves_made.count, 0) as saves_made,
    COALESCE(quiz_attempts.count, 0) as quizzes_completed,
    COALESCE(quiz_attempts.accuracy, 0) as quiz_accuracy_percentage
  INTO user_stats
  FROM profiles profile
  -- Count likes given by this user
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM (
      SELECT user_id FROM insight_likes 
      UNION ALL 
      SELECT user_id FROM article_likes
    ) all_likes 
    WHERE user_id = target_user_id
    GROUP BY user_id
  ) likes_given ON likes_given.user_id = profile.id
  -- Count likes received on this user's content
  LEFT JOIN (
    SELECT insights.author_id as user_id, COUNT(*) as count
    FROM insight_likes 
    JOIN insights ON insight_likes.insight_id = insights.id
    WHERE insights.author_id = target_user_id
    GROUP BY insights.author_id
  ) likes_received ON likes_received.user_id = profile.id
  -- Count comments made by this user
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM insight_comments 
    WHERE user_id = target_user_id
    GROUP BY user_id
  ) comments_made ON comments_made.user_id = profile.id
  -- Count saves made by this user
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM (
      SELECT user_id FROM insight_saves 
      UNION ALL 
      SELECT user_id FROM article_saves
    ) all_saves 
    WHERE user_id = target_user_id
    GROUP BY user_id
  ) saves_made ON saves_made.user_id = profile.id
  -- Quiz stats
  LEFT JOIN (
    SELECT 
      user_id, 
      COUNT(*) as count,
      CASE WHEN COUNT(*) > 0 THEN (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::float / COUNT(*) * 100) ELSE 0 END as accuracy
    FROM quiz_attempts 
    WHERE user_id = target_user_id
    GROUP BY user_id
  ) quiz_attempts ON quiz_attempts.user_id = profile.id
  WHERE profile.id = target_user_id;

  -- Check all active achievements for this action type
  FOR achievement_record IN
    SELECT * FROM achievements 
    WHERE is_active = true 
    AND (criteria->>'action' = action_type OR action_type = 'any')
  LOOP
    -- Skip if user already has this achievement
    IF EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = target_user_id AND achievement_id = achievement_record.id
    ) THEN
      CONTINUE;
    END IF;
    
    -- Check if user meets the criteria
    DECLARE
      meets_criteria BOOLEAN := FALSE;
      criteria JSONB := achievement_record.criteria;
    BEGIN
      CASE criteria->>'action'
        WHEN 'first_insight' THEN
          meets_criteria := user_stats.insights_published >= 1;
        WHEN 'insights_published' THEN
          meets_criteria := user_stats.insights_published >= (criteria->>'target')::int;
        WHEN 'first_like_given' THEN
          meets_criteria := user_stats.likes_given >= 1;
        WHEN 'likes_given' THEN
          meets_criteria := user_stats.likes_given >= (criteria->>'target')::int;
        WHEN 'first_like_received' THEN
          meets_criteria := user_stats.likes_received >= 1;
        WHEN 'total_likes_received' THEN
          meets_criteria := user_stats.likes_received >= (criteria->>'target')::int;
        WHEN 'first_comment' THEN
          meets_criteria := user_stats.comments_made >= 1;
        WHEN 'comments_made' THEN
          meets_criteria := user_stats.comments_made >= (criteria->>'target')::int;
        WHEN 'first_save' THEN
          meets_criteria := user_stats.saves_made >= 1;
        WHEN 'saves_made' THEN
          meets_criteria := user_stats.saves_made >= (criteria->>'target')::int;
        WHEN 'first_quiz' THEN
          meets_criteria := user_stats.quizzes_completed >= 1;
        WHEN 'quizzes_completed' THEN
          meets_criteria := user_stats.quizzes_completed >= (criteria->>'target')::int;
        WHEN 'quiz_accuracy' THEN
          meets_criteria := user_stats.quizzes_completed >= COALESCE((criteria->>'minimum_quizzes')::int, 5) AND 
                           user_stats.quiz_accuracy_percentage >= (criteria->>'percentage')::int;
        ELSE
          meets_criteria := FALSE;
      END CASE;
      
      -- Award achievement if criteria met
      IF meets_criteria THEN
        -- Award the achievement
        INSERT INTO user_achievements (
          user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
        ) VALUES (
          target_user_id, achievement_record.id, achievement_record.category,
          achievement_record.name, achievement_record.description, achievement_record.icon_name, NOW()
        );
        
        -- Award voltz
        UPDATE profiles 
        SET spendable_voltz = spendable_voltz + achievement_record.voltz_reward,
            total_voltz_earned = total_voltz_earned + achievement_record.voltz_reward
        WHERE id = target_user_id;
        
        -- Log voltz transaction
        INSERT INTO xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
        VALUES (
          target_user_id, achievement_record.voltz_reward,
          'Achievement: ' || achievement_record.name, 'achievement', achievement_record.id::text, 'earned'
        );
        
        RAISE NOTICE 'Achievement awarded: % to user % (% voltz)', achievement_record.name, target_user_id, achievement_record.voltz_reward;
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger function for insight likes
CREATE OR REPLACE FUNCTION public.trigger_achievement_insight_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Award achievements to the user who gave the like
  PERFORM public.check_and_award_achievements(NEW.user_id, 'first_like_given');
  PERFORM public.check_and_award_achievements(NEW.user_id, 'likes_given');
  
  -- Award achievements to the author who received the like
  DECLARE
    author_id UUID;
  BEGIN
    SELECT insights.author_id INTO author_id FROM insights WHERE id = NEW.insight_id;
    IF author_id IS NOT NULL AND author_id != NEW.user_id THEN
      PERFORM public.check_and_award_achievements(author_id, 'first_like_received');
      PERFORM public.check_and_award_achievements(author_id, 'total_likes_received');
    END IF;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger function for article likes
CREATE OR REPLACE FUNCTION public.trigger_achievement_article_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Award achievements to the user who gave the like
  PERFORM public.check_and_award_achievements(NEW.user_id, 'first_like_given');
  PERFORM public.check_and_award_achievements(NEW.user_id, 'likes_given');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger function for comments
CREATE OR REPLACE FUNCTION public.trigger_achievement_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Award achievements to the user who made the comment
  PERFORM public.check_and_award_achievements(NEW.user_id, 'first_comment');
  PERFORM public.check_and_award_achievements(NEW.user_id, 'comments_made');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger function for saves
CREATE OR REPLACE FUNCTION public.trigger_achievement_save()
RETURNS TRIGGER AS $$
BEGIN
  -- Award achievements to the user who made the save
  PERFORM public.check_and_award_achievements(NEW.user_id, 'first_save');
  PERFORM public.check_and_award_achievements(NEW.user_id, 'saves_made');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger function for insights
CREATE OR REPLACE FUNCTION public.trigger_achievement_insight()
RETURNS TRIGGER AS $$
BEGIN
  -- Award achievements to the author who published the insight
  PERFORM public.check_and_award_achievements(NEW.author_id, 'first_insight');
  PERFORM public.check_and_award_achievements(NEW.author_id, 'insights_published');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger function for quiz attempts
CREATE OR REPLACE FUNCTION public.trigger_achievement_quiz()
RETURNS TRIGGER AS $$
BEGIN
  -- Award achievements to the user who attempted the quiz
  PERFORM public.check_and_award_achievements(NEW.user_id, 'first_quiz');
  PERFORM public.check_and_award_achievements(NEW.user_id, 'quizzes_completed');
  PERFORM public.check_and_award_achievements(NEW.user_id, 'quiz_accuracy');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create all the triggers
-- Insight likes trigger
DROP TRIGGER IF EXISTS achievement_trigger_insight_likes ON public.insight_likes;
CREATE TRIGGER achievement_trigger_insight_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_achievement_insight_like();

-- Article likes trigger
DROP TRIGGER IF EXISTS achievement_trigger_article_likes ON public.article_likes;
CREATE TRIGGER achievement_trigger_article_likes
  AFTER INSERT ON public.article_likes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_achievement_article_like();

-- Insight comments trigger
DROP TRIGGER IF EXISTS achievement_trigger_insight_comments ON public.insight_comments;
CREATE TRIGGER achievement_trigger_insight_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_achievement_comment();

-- Insight saves trigger
DROP TRIGGER IF EXISTS achievement_trigger_insight_saves ON public.insight_saves;
CREATE TRIGGER achievement_trigger_insight_saves
  AFTER INSERT ON public.insight_saves
  FOR EACH ROW EXECUTE FUNCTION public.trigger_achievement_save();

-- Article saves trigger
DROP TRIGGER IF EXISTS achievement_trigger_article_saves ON public.article_saves;
CREATE TRIGGER achievement_trigger_article_saves
  AFTER INSERT ON public.article_saves
  FOR EACH ROW EXECUTE FUNCTION public.trigger_achievement_save();

-- Insights trigger
DROP TRIGGER IF EXISTS achievement_trigger_insights ON public.insights;
CREATE TRIGGER achievement_trigger_insights
  AFTER INSERT ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.trigger_achievement_insight();

-- Quiz attempts trigger
DROP TRIGGER IF EXISTS achievement_trigger_quiz_attempts ON public.quiz_attempts;
CREATE TRIGGER achievement_trigger_quiz_attempts
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_achievement_quiz();

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION public.check_and_award_achievements(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_achievement_insight_like() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_achievement_article_like() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_achievement_comment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_achievement_save() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_achievement_insight() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_achievement_quiz() TO authenticated;

SELECT 'Achievement triggers system installed successfully!' as status;