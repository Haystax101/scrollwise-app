-- Fix for achievements not being awarded
-- Add triggers to check achievements when relevant actions occur

BEGIN;

-- Create trigger for insights creation
DROP TRIGGER IF EXISTS trigger_check_achievements_on_insight_creation ON insights;
CREATE TRIGGER trigger_check_achievements_on_insight_creation
  AFTER INSERT ON insights
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

-- Create trigger for comments creation  
DROP TRIGGER IF EXISTS trigger_check_achievements_on_comment_creation ON comments;
CREATE TRIGGER trigger_check_achievements_on_comment_creation
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

-- Create trigger for insight comments creation
DROP TRIGGER IF EXISTS trigger_check_achievements_on_insight_comment_creation ON insight_comments;
CREATE TRIGGER trigger_check_achievements_on_insight_comment_creation
  AFTER INSERT ON insight_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

-- Create trigger for saves (article_saves, book_saves, paper_saves)
DROP TRIGGER IF EXISTS trigger_check_achievements_on_article_save ON article_saves;
CREATE TRIGGER trigger_check_achievements_on_article_save
  AFTER INSERT ON article_saves
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

DROP TRIGGER IF EXISTS trigger_check_achievements_on_book_save ON book_saves;
CREATE TRIGGER trigger_check_achievements_on_book_save
  AFTER INSERT ON book_saves
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

DROP TRIGGER IF EXISTS trigger_check_achievements_on_paper_save ON paper_saves;
CREATE TRIGGER trigger_check_achievements_on_paper_save
  AFTER INSERT ON paper_saves
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

-- Create trigger for content views
DROP TRIGGER IF EXISTS trigger_check_achievements_on_content_view ON content_views;
CREATE TRIGGER trigger_check_achievements_on_content_view
  AFTER INSERT ON content_views
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

-- Create trigger for XP changes (for milestones)
DROP TRIGGER IF EXISTS trigger_check_achievements_on_xp_change ON xp_ledger;
CREATE TRIGGER trigger_check_achievements_on_xp_change
  AFTER INSERT ON xp_ledger
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

-- Create trigger for level changes
DROP TRIGGER IF EXISTS trigger_check_achievements_on_level_change ON profiles;
CREATE TRIGGER trigger_check_achievements_on_level_change
  AFTER UPDATE OF level ON profiles
  FOR EACH ROW
  WHEN (OLD.level IS DISTINCT FROM NEW.level)
  EXECUTE FUNCTION trigger_check_achievements();

-- Create trigger for streak updates
DROP TRIGGER IF EXISTS trigger_check_achievements_on_streak_update ON user_streaks;
CREATE TRIGGER trigger_check_achievements_on_streak_update
  AFTER UPDATE OF current_streak ON user_streaks
  FOR EACH ROW
  WHEN (OLD.current_streak IS DISTINCT FROM NEW.current_streak)
  EXECUTE FUNCTION trigger_check_achievements();

-- Fix the achievement checking function to handle the case where user_content_interactions might be empty
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  achievement_record RECORD;
  user_stats JSONB;
  awarded_count INTEGER := 0;
  already_earned BOOLEAN;
  criteria_met BOOLEAN;
  prerequisites_met BOOLEAN;
BEGIN
  -- Gather user statistics with better null handling
  WITH content_stats AS (
    SELECT 
      COUNT(DISTINCT (content_type, content_id)) as content_views,
      COUNT(*) FILTER (WHERE 'saved' = ANY(interaction_types)) as saves_count
    FROM user_content_interactions 
    WHERE user_id = p_user_id
  ),
  comment_stats AS (
    SELECT 
      COALESCE((SELECT COUNT(*) FROM comments WHERE user_id = p_user_id), 0) +
      COALESCE((SELECT COUNT(*) FROM insight_comments WHERE user_id = p_user_id), 0) as comments_made
  ),
  profile_stats AS (
    SELECT 
      COALESCE(xp, 0) as total_xp,
      COALESCE(level, 1) as user_level
    FROM profiles 
    WHERE id = p_user_id
  ),
  streak_stats AS (
    SELECT COALESCE(current_streak, 0) as current_streak
    FROM user_streaks 
    WHERE user_id = p_user_id AND is_active = true 
    LIMIT 1
  ),
  skill_stats AS (
    SELECT COUNT(*) as skills_count
    FROM user_skills 
    WHERE user_id = p_user_id
  ),
  analytics_stats AS (
    SELECT COALESCE(monthly_minutes_current, 0) as monthly_minutes
    FROM user_learning_analytics 
    WHERE user_id = p_user_id
  ),
  insight_stats AS (
    SELECT COUNT(*) as insights_created
    FROM insights 
    WHERE author_id = p_user_id
  )
  SELECT jsonb_build_object(
    'content_views', COALESCE(cs.content_views, 0),
    'saves_count', COALESCE(cs.saves_count, 0),
    'comments_made', COALESCE(cms.comments_made, 0),
    'current_streak', COALESCE(ss.current_streak, 0),
    'total_xp', COALESCE(ps.total_xp, 0),
    'skills_count', COALESCE(sks.skills_count, 0),
    'monthly_minutes', COALESCE(anas.monthly_minutes, 0),
    'insights_created', COALESCE(ins.insights_created, 0),
    'user_level', COALESCE(ps.user_level, 1)
  )
  FROM (SELECT 1) dummy
  LEFT JOIN content_stats cs ON true
  LEFT JOIN comment_stats cms ON true
  LEFT JOIN profile_stats ps ON true
  LEFT JOIN streak_stats ss ON true
  LEFT JOIN skill_stats sks ON true
  LEFT JOIN analytics_stats anas ON true
  LEFT JOIN insight_stats ins ON true
  INTO user_stats;
  
  -- Check each active achievement
  FOR achievement_record IN 
    SELECT * FROM achievements WHERE is_active = true ORDER BY unlock_order, created_at
  LOOP
    -- Check if user already has this achievement
    SELECT EXISTS(
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id
    ) INTO already_earned;
    
    IF already_earned THEN
      CONTINUE;
    END IF;
    
    -- Check prerequisites
    prerequisites_met := TRUE;
    IF achievement_record.prerequisite_achievement_ids IS NOT NULL AND array_length(achievement_record.prerequisite_achievement_ids, 1) > 0 THEN
      SELECT NOT EXISTS(
        SELECT 1 FROM unnest(achievement_record.prerequisite_achievement_ids) AS prereq_id
        WHERE prereq_id NOT IN (
          SELECT achievement_id FROM user_achievements WHERE user_id = p_user_id
        )
      ) INTO prerequisites_met;
    END IF;
    
    IF NOT prerequisites_met THEN
      CONTINUE;
    END IF;
    
    -- Check criteria
    SELECT check_achievement_criteria(p_user_id, achievement_record.id, user_stats) INTO criteria_met;
    
    IF criteria_met THEN
      -- Award the achievement
      INSERT INTO user_achievements (user_id, achievement_id, title, description, icon_name, earned_at, progress_current, progress_total)
      VALUES (p_user_id, achievement_record.id, achievement_record.name, achievement_record.description, 
              achievement_record.icon_name, NOW(), 1, 1);
      
      -- Award points and voltz
      IF achievement_record.points_reward > 0 THEN
        INSERT INTO xp_ledger (user_id, amount, reason, subject_type, subject_id, actor_id)
        VALUES (p_user_id, achievement_record.points_reward, 'achievement_unlocked', 'achievement', 
                achievement_record.id::text, p_user_id);
        
        -- Update user XP and level
        PERFORM update_user_xp_and_level(p_user_id, achievement_record.points_reward);
      END IF;
      
      IF achievement_record.voltz_reward > 0 THEN
        UPDATE profiles 
        SET spendable_voltz = spendable_voltz + achievement_record.voltz_reward,
            total_voltz_earned = COALESCE(total_voltz_earned, 0) + achievement_record.voltz_reward
        WHERE id = p_user_id;
      END IF;
      
      awarded_count := awarded_count + 1;
      
      -- Log the achievement award for debugging
      RAISE NOTICE 'Awarded achievement % to user %', achievement_record.name, p_user_id;
    END IF;
  END LOOP;
  
  RETURN awarded_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;