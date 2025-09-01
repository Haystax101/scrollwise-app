-- Fix Onboarding Achievement System
-- This corrects the onboarding service to work with the actual achievement system
-- Key fixes:
-- 1. Creates proper triggers for onboarding-related actions
-- 2. Ensures achievement_type matches what onboarding service expects
-- 3. Handles field naming correctly (user_id vs author_id)
-- 4. Links automatic achievement detection to onboarding completion

-- Drop any existing onboarding-related triggers to avoid conflicts
DROP TRIGGER IF EXISTS onboarding_trigger_first_like ON public.insight_likes;
DROP TRIGGER IF EXISTS onboarding_trigger_first_like ON public.article_likes;
DROP TRIGGER IF EXISTS onboarding_trigger_first_comment ON public.insight_comments;
DROP TRIGGER IF EXISTS onboarding_trigger_first_insight ON public.insights;
DROP TRIGGER IF EXISTS onboarding_trigger_profile_complete ON public.profiles;

-- 1. Create onboarding achievement detection function
CREATE OR REPLACE FUNCTION public.check_onboarding_achievements(target_user_id UUID, action_type TEXT)
RETURNS VOID AS $$
DECLARE
  achievement_record RECORD;
  user_stats RECORD;
  profile_completion INTEGER;
BEGIN
  -- Get current user stats for onboarding achievement checking
  SELECT 
    COALESCE(likes_given.count, 0) as likes_given_count,
    COALESCE(comments_made.count, 0) as comments_made_count,
    COALESCE(insights_published.count, 0) as insights_published_count,
    COALESCE(p.profile_completion_percentage, 0) as profile_completion
  INTO user_stats
  FROM profiles p
  -- Count likes given by this user across all content types
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM (
      SELECT user_id FROM insight_likes 
      UNION ALL 
      SELECT user_id FROM article_likes
      UNION ALL 
      SELECT user_id FROM paper_likes
      UNION ALL 
      SELECT user_id FROM book_likes
    ) all_likes 
    WHERE user_id = target_user_id
    GROUP BY user_id
  ) likes_given ON likes_given.user_id = p.id
  -- Count comments made by this user across all content types
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM (
      SELECT user_id FROM insight_comments 
      UNION ALL 
      SELECT user_id FROM comments
      UNION ALL 
      SELECT user_id FROM paper_comments
      UNION ALL 
      SELECT user_id FROM book_comments
    ) all_comments 
    WHERE user_id = target_user_id
    GROUP BY user_id
  ) comments_made ON comments_made.user_id = p.id
  -- Count insights published by this user
  LEFT JOIN (
    SELECT author_id as user_id, COUNT(*) as count 
    FROM insights 
    WHERE author_id = target_user_id
    GROUP BY author_id
  ) insights_published ON insights_published.user_id = p.id
  WHERE p.id = target_user_id;

  -- Check for onboarding step completions and award achievements
  
  -- Check "The Supporter" - first like given
  IF action_type = 'first_like_given' AND user_stats.likes_given_count >= 1 THEN
    SELECT * INTO achievement_record
    FROM achievements 
    WHERE name = 'The Supporter' AND is_active = true;
    
    IF FOUND AND NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = target_user_id AND achievement_id = achievement_record.id
    ) THEN
      -- Award achievement
      INSERT INTO user_achievements (
        user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
      ) VALUES (
        target_user_id, achievement_record.id, achievement_record.name,
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
      
      RAISE NOTICE 'Onboarding achievement awarded: % to user %', achievement_record.name, target_user_id;
    END IF;
  END IF;

  -- Check "Conversation Starter" - first comment
  IF action_type = 'first_comment' AND user_stats.comments_made_count >= 1 THEN
    SELECT * INTO achievement_record
    FROM achievements 
    WHERE name = 'Conversation Starter' AND is_active = true;
    
    IF FOUND AND NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = target_user_id AND achievement_id = achievement_record.id
    ) THEN
      -- Award achievement
      INSERT INTO user_achievements (
        user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
      ) VALUES (
        target_user_id, achievement_record.id, achievement_record.name,
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
      
      RAISE NOTICE 'Onboarding achievement awarded: % to user %', achievement_record.name, target_user_id;
    END IF;
  END IF;

  -- Check "First Words" - first insight published
  IF action_type = 'first_insight' AND user_stats.insights_published_count >= 1 THEN
    SELECT * INTO achievement_record
    FROM achievements 
    WHERE name = 'First Words' AND is_active = true;
    
    IF FOUND AND NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = target_user_id AND achievement_id = achievement_record.id
    ) THEN
      -- Award achievement
      INSERT INTO user_achievements (
        user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
      ) VALUES (
        target_user_id, achievement_record.id, achievement_record.name,
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
      
      RAISE NOTICE 'Onboarding achievement awarded: % to user %', achievement_record.name, target_user_id;
    END IF;
  END IF;

  -- Check "Profile Perfectionist" - 100% profile completion
  IF action_type = 'profile_completion' AND user_stats.profile_completion >= 100 THEN
    SELECT * INTO achievement_record
    FROM achievements 
    WHERE name = 'Profile Perfectionist' AND is_active = true;
    
    IF FOUND AND NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = target_user_id AND achievement_id = achievement_record.id
    ) THEN
      -- Award achievement
      INSERT INTO user_achievements (
        user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
      ) VALUES (
        target_user_id, achievement_record.id, achievement_record.name,
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
      
      RAISE NOTICE 'Onboarding achievement awarded: % to user %', achievement_record.name, target_user_id;
    END IF;
  END IF;

  -- Check if all onboarding achievements are complete and award completion bonus
  DECLARE
    onboarding_achievements_count INTEGER;
    user_onboarding_achievements_count INTEGER;
  BEGIN
    -- Count total onboarding achievements
    SELECT COUNT(*) INTO onboarding_achievements_count
    FROM achievements
    WHERE name IN ('The Supporter', 'Conversation Starter', 'First Words', 'Profile Perfectionist')
    AND is_active = true;
    
    -- Count user's onboarding achievements
    SELECT COUNT(*) INTO user_onboarding_achievements_count
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = target_user_id
    AND a.name IN ('The Supporter', 'Conversation Starter', 'First Words', 'Profile Perfectionist')
    AND a.is_active = true;
    
    -- If all onboarding achievements are complete, award the completion bonus
    IF user_onboarding_achievements_count >= onboarding_achievements_count THEN
      SELECT * INTO achievement_record
      FROM achievements 
      WHERE name = 'Onboarding Graduate' AND is_active = true;
      
      IF FOUND AND NOT EXISTS (
        SELECT 1 FROM user_achievements 
        WHERE user_id = target_user_id AND achievement_id = achievement_record.id
      ) THEN
        -- Award completion achievement
        INSERT INTO user_achievements (
          user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
        ) VALUES (
          target_user_id, achievement_record.id, achievement_record.name,
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
        
        RAISE NOTICE 'Onboarding completion achievement awarded: % to user %', achievement_record.name, target_user_id;
      END IF;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger functions for onboarding achievements

-- Trigger function for likes (first like given)
CREATE OR REPLACE FUNCTION public.trigger_onboarding_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for first like achievement for the user who gave the like
  PERFORM public.check_onboarding_achievements(NEW.user_id, 'first_like_given');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for comments (first comment)
CREATE OR REPLACE FUNCTION public.trigger_onboarding_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for first comment achievement for the user who made the comment
  PERFORM public.check_onboarding_achievements(NEW.user_id, 'first_comment');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for insights (first insight)
CREATE OR REPLACE FUNCTION public.trigger_onboarding_insight()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for first insight achievement for the author
  PERFORM public.check_onboarding_achievements(NEW.author_id, 'first_insight');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for profile completion
CREATE OR REPLACE FUNCTION public.trigger_onboarding_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for profile completion achievement when profile is updated
  IF NEW.profile_completion_percentage >= 100 AND (OLD.profile_completion_percentage IS NULL OR OLD.profile_completion_percentage < 100) THEN
    PERFORM public.check_onboarding_achievements(NEW.id, 'profile_completion');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the triggers

-- Like triggers - covers all content types
CREATE TRIGGER onboarding_trigger_insight_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_onboarding_like();

CREATE TRIGGER onboarding_trigger_article_likes
  AFTER INSERT ON public.article_likes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_onboarding_like();

CREATE TRIGGER onboarding_trigger_paper_likes
  AFTER INSERT ON public.paper_likes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_onboarding_like();

CREATE TRIGGER onboarding_trigger_book_likes
  AFTER INSERT ON public.book_likes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_onboarding_like();

-- Comment triggers - covers all content types
CREATE TRIGGER onboarding_trigger_insight_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_onboarding_comment();

CREATE TRIGGER onboarding_trigger_article_comments
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_onboarding_comment();

CREATE TRIGGER onboarding_trigger_paper_comments
  AFTER INSERT ON public.paper_comments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_onboarding_comment();

CREATE TRIGGER onboarding_trigger_book_comments
  AFTER INSERT ON public.book_comments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_onboarding_comment();

-- Insight trigger
CREATE TRIGGER onboarding_trigger_insights
  AFTER INSERT ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.trigger_onboarding_insight();

-- Profile completion trigger
CREATE TRIGGER onboarding_trigger_profile_completion
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_onboarding_profile();

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.check_onboarding_achievements(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_onboarding_like() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_onboarding_comment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_onboarding_insight() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_onboarding_profile() TO authenticated;

-- 5. Test notification
DO $$
BEGIN
  RAISE NOTICE 'Onboarding achievement system installed successfully!';
  RAISE NOTICE 'Key features:';
  RAISE NOTICE '- Sets achievement_type = achievement.name (not category) to match onboarding service expectations';
  RAISE NOTICE '- Correctly uses user_id for all tables except insights (which uses author_id)';
  RAISE NOTICE '- Triggers on all content types for likes and comments';
  RAISE NOTICE '- Awards "Onboarding Graduate" when all 4 achievements are complete';
  RAISE NOTICE '- Integrates with existing voltz and XP ledger systems';
  RAISE NOTICE 'Achievement detection is now automatic for:';
  RAISE NOTICE '1. "The Supporter" - first like on any content';
  RAISE NOTICE '2. "Conversation Starter" - first comment on any content';  
  RAISE NOTICE '3. "First Words" - first insight published';
  RAISE NOTICE '4. "Profile Perfectionist" - 100% profile completion';
  RAISE NOTICE '5. "Onboarding Graduate" - all above achievements completed';
END $$;