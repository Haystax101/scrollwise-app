-- Simple function to check all achievements when profile loads
-- This is much cleaner than triggers and ensures achievements are always up to date

CREATE OR REPLACE FUNCTION public.check_all_user_achievements(target_user_id UUID)
RETURNS TABLE(newly_awarded_count INTEGER) AS $$
DECLARE
  achievement_record RECORD;
  user_stats RECORD;
  awards_count INTEGER := 0;
BEGIN
  -- Get comprehensive user stats
  SELECT 
    -- Basic counts from actual profile columns
    COALESCE(insights_count.count, 0) as insights_published,
    COALESCE(profile_data.level, 1) as user_level,
    COALESCE(profile_data.total_voltz_earned, 0) as total_voltz,
    
    -- Engagement stats
    COALESCE(likes_given.count, 0) as likes_given,
    COALESCE(likes_received.count, 0) as likes_received,
    COALESCE(comments_made.count, 0) as comments_made,
    COALESCE(saves_made.count, 0) as saves_made,
    
    -- Quiz stats
    COALESCE(quiz_data.total_attempts, 0) as quizzes_completed,
    COALESCE(quiz_data.accuracy_percentage, 0) as quiz_accuracy_percentage,
    COALESCE(quiz_data.correct_answers, 0) as correct_quiz_answers,
    
    -- Content stats
    COALESCE(content_stats.articles_viewed, 0) as articles_viewed,
    COALESCE(content_stats.insights_viewed, 0) as insights_viewed,
    
    -- Social stats
    COALESCE(social_stats.max_likes_single_post, 0) as max_likes_on_single_post,
    COALESCE(social_stats.posts_with_likes, 0) as posts_with_engagement
    
  INTO user_stats
  FROM profiles profile_data
  
  -- Count insights published by this user
  LEFT JOIN (
    SELECT COUNT(*) as count 
    FROM insights 
    WHERE author_id = target_user_id
  ) insights_count ON true
  
  -- Count likes given by this user
  LEFT JOIN (
    SELECT COUNT(*) as count 
    FROM (
      SELECT user_id FROM insight_likes WHERE user_id = target_user_id
      UNION ALL 
      SELECT user_id FROM article_likes WHERE user_id = target_user_id
    ) all_likes
  ) likes_given ON true
  
  -- Count likes received on this user's content  
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM insight_likes il
    JOIN insights i ON il.insight_id = i.id
    WHERE i.author_id = target_user_id
  ) likes_received ON true
  
  -- Count comments made by this user
  LEFT JOIN (
    SELECT COUNT(*) as count 
    FROM insight_comments 
    WHERE user_id = target_user_id
  ) comments_made ON true
  
  -- Count saves made by this user
  LEFT JOIN (
    SELECT COUNT(*) as count 
    FROM (
      SELECT user_id FROM insight_saves WHERE user_id = target_user_id
      UNION ALL 
      SELECT user_id FROM article_saves WHERE user_id = target_user_id
    ) all_saves
  ) saves_made ON true
  
  -- Quiz comprehensive stats
  LEFT JOIN (
    SELECT 
      COUNT(*) as total_attempts,
      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
      CASE WHEN COUNT(*) > 0 THEN 
        (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::float / COUNT(*) * 100)::numeric(5,2)
      ELSE 0 END as accuracy_percentage
    FROM quiz_attempts 
    WHERE user_id = target_user_id
  ) quiz_data ON true
  
  -- Content viewing stats
  LEFT JOIN (
    SELECT 
      COALESCE((SELECT COUNT(*) FROM article_views WHERE user_id = target_user_id), 0) as articles_viewed,
      COALESCE((SELECT COUNT(*) FROM insight_views WHERE user_id = target_user_id), 0) as insights_viewed
  ) content_stats ON true
  
  -- Social engagement stats
  LEFT JOIN (
    SELECT 
      COALESCE(MAX(like_counts.likes), 0) as max_likes_single_post,
      COUNT(CASE WHEN like_counts.likes > 0 THEN 1 END) as posts_with_likes
    FROM (
      SELECT il.insight_id, COUNT(*) as likes
      FROM insight_likes il
      JOIN insights i ON il.insight_id = i.id  
      WHERE i.author_id = target_user_id
      GROUP BY il.insight_id
    ) like_counts
  ) social_stats ON true
  
  WHERE profile_data.id = target_user_id;

  -- Check each active achievement
  FOR achievement_record IN
    SELECT * FROM achievements WHERE is_active = true ORDER BY unlock_order
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
      target_val INTEGER;
      percentage_val INTEGER;
      minimum_val INTEGER;
    BEGIN
      -- Extract common criteria values
      target_val := COALESCE((criteria->>'target')::int, 1);
      percentage_val := COALESCE((criteria->>'percentage')::int, 100);
      minimum_val := COALESCE((criteria->>'minimum_quizzes')::int, 5);
      
      -- Check criteria based on action type
      CASE criteria->>'action'
        WHEN 'first_insight' THEN
          meets_criteria := user_stats.insights_published >= 1;
        WHEN 'insights_published' THEN
          meets_criteria := user_stats.insights_published >= target_val;
        WHEN 'first_like_given' THEN
          meets_criteria := user_stats.likes_given >= 1;
        WHEN 'likes_given' THEN
          meets_criteria := user_stats.likes_given >= target_val;
        WHEN 'first_like_received' THEN
          meets_criteria := user_stats.likes_received >= 1;
        WHEN 'total_likes_received' THEN
          meets_criteria := user_stats.likes_received >= target_val;
        WHEN 'first_comment' THEN
          meets_criteria := user_stats.comments_made >= 1;
        WHEN 'comments_made' THEN
          meets_criteria := user_stats.comments_made >= target_val;
        WHEN 'first_save' THEN
          meets_criteria := user_stats.saves_made >= 1;
        WHEN 'saves_made' THEN
          meets_criteria := user_stats.saves_made >= target_val;
        WHEN 'first_quiz' THEN
          meets_criteria := user_stats.quizzes_completed >= 1;
        WHEN 'quizzes_completed' THEN
          meets_criteria := user_stats.quizzes_completed >= target_val;
        WHEN 'quiz_accuracy' THEN
          meets_criteria := user_stats.quizzes_completed >= minimum_val AND 
                           user_stats.quiz_accuracy_percentage >= percentage_val;
        WHEN 'content_explorer' THEN
          meets_criteria := (user_stats.articles_viewed + user_stats.insights_viewed) >= target_val;
        WHEN 'level_reached' THEN
          meets_criteria := user_stats.user_level >= target_val;
        WHEN 'voltz_milestone' THEN
          meets_criteria := user_stats.total_voltz >= target_val;
        WHEN 'viral_content' THEN
          meets_criteria := user_stats.max_likes_on_single_post >= target_val;
        ELSE
          -- Unknown criteria, skip
          meets_criteria := FALSE;
      END CASE;
      
      -- Award achievement if criteria met
      IF meets_criteria THEN
        -- Insert achievement
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
        
        awards_count := awards_count + 1;
        
        RAISE NOTICE 'NEW ACHIEVEMENT: % awarded to user % (% voltz)', 
          achievement_record.name, target_user_id, achievement_record.voltz_reward;
      END IF;
    END;
  END LOOP;
  
  RETURN QUERY SELECT awards_count;
END;
$$ LANGUAGE plpgsql;