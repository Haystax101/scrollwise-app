-- Migration 004: Create Modern Achievements System
-- This migration creates a flexible achievement system with automated unlocking
-- Enhances the existing basic achievements belt with real functionality

BEGIN;

-- Create achievement definitions table with flexible criteria
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('learning', 'engagement', 'streak', 'milestone', 'social', 'skill', 'completion')),
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  criteria JSONB NOT NULL, -- Flexible criteria definition
  points_reward INTEGER DEFAULT 0 CHECK (points_reward >= 0),
  voltz_reward INTEGER DEFAULT 0 CHECK (voltz_reward >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  is_secret BOOLEAN DEFAULT FALSE, -- Hidden achievements
  unlock_order INTEGER DEFAULT 0, -- For ordered unlocking
  prerequisite_achievement_ids UUID[], -- Required achievements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhance existing user_achievements table
-- First check if columns already exist to avoid errors
DO $$ 
BEGIN
  -- Add progress tracking columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'progress_current') THEN
    ALTER TABLE user_achievements ADD COLUMN progress_current INTEGER DEFAULT 0 CHECK (progress_current >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'progress_total') THEN
    ALTER TABLE user_achievements ADD COLUMN progress_total INTEGER DEFAULT 1 CHECK (progress_total > 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'is_featured') THEN
    ALTER TABLE user_achievements ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'notification_sent') THEN
    ALTER TABLE user_achievements ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'achievement_id') THEN
    ALTER TABLE user_achievements ADD COLUMN achievement_id UUID REFERENCES achievements(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'unlock_context') THEN
    ALTER TABLE user_achievements ADD COLUMN unlock_context JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create achievement progress tracking table for partial progress
CREATE TABLE IF NOT EXISTS user_achievement_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress_data JSONB DEFAULT '{}'::jsonb, -- Flexible progress data
  current_value INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  last_progress_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id) -- One progress record per user per achievement
);

-- Create achievement categories for organization
CREATE TABLE IF NOT EXISTS achievement_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_achievements_category ON achievements(category) WHERE is_active = true;
CREATE INDEX idx_achievements_rarity ON achievements(rarity) WHERE is_active = true;
CREATE INDEX idx_achievements_active ON achievements(is_active) WHERE is_active = true;
CREATE INDEX idx_achievements_secret ON achievements(is_secret);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_featured ON user_achievements(user_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_user_achievements_earned ON user_achievements(earned_at DESC);

CREATE INDEX idx_achievement_progress_user ON user_achievement_progress(user_id);
CREATE INDEX idx_achievement_progress_incomplete ON user_achievement_progress(user_id, is_completed) WHERE is_completed = false;

-- Add RLS policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievement_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_categories ENABLE ROW LEVEL SECURITY;

-- Achievement definitions are public (read-only)
CREATE POLICY "Anyone can view active achievements" ON achievements
  FOR SELECT USING (is_active = true AND is_secret = false);

CREATE POLICY "Anyone can view secret achievements they've unlocked" ON achievements
  FOR SELECT USING (
    is_active = true AND (
      is_secret = false OR 
      id IN (SELECT achievement_id FROM user_achievements WHERE user_id = auth.uid())
    )
  );

-- Achievement progress policies
CREATE POLICY "Users can view their own achievement progress" ON user_achievement_progress
  FOR SELECT USING (auth.uid() = user_id);

-- System can manage achievement progress (via functions)
CREATE POLICY "System can manage achievement progress" ON user_achievement_progress
  FOR ALL USING (auth.uid() = user_id);

-- Categories are public
CREATE POLICY "Anyone can view achievement categories" ON achievement_categories
  FOR SELECT USING (is_active = true);

-- Insert default achievement categories
INSERT INTO achievement_categories (name, description, icon_name, display_order) VALUES
('Learning', 'Achievements for content consumption and learning activities', 'book-open', 1),
('Engagement', 'Achievements for community interaction and participation', 'message-circle', 2),
('Streaks', 'Achievements for consistent learning habits', 'zap', 3),
('Milestones', 'Achievements for reaching significant goals', 'award', 4),
('Social', 'Achievements for networking and collaboration', 'users', 5),
('Skills', 'Achievements for skill development and expertise', 'tool', 6),
('Completion', 'Achievements for completing courses or programs', 'check-circle', 7)
ON CONFLICT (name) DO NOTHING;

-- Insert sample achievements with flexible criteria
INSERT INTO achievements (name, description, icon_name, category, rarity, criteria, points_reward, voltz_reward) VALUES
('First Steps', 'Read your first article', 'book-open', 'learning', 'common', 
 '{"type": "content_views", "target": 1, "content_type": "article"}', 10, 5),

('Learning Streak', 'Maintain a 7-day learning streak', 'zap', 'streak', 'uncommon',
 '{"type": "learning_streak", "target": 7, "consecutive": true}', 50, 25),

('Knowledge Seeker', 'Save 25 pieces of content', 'bookmark', 'learning', 'common',
 '{"type": "saves_count", "target": 25}', 25, 10),

('Social Butterfly', 'Comment on 10 insights', 'message-circle', 'engagement', 'common',
 '{"type": "comments_made", "target": 10, "content_type": "insight"}', 30, 15),

('XP Master', 'Earn 1000 total XP', 'award', 'milestone', 'rare',
 '{"type": "total_xp", "target": 1000}', 100, 50),

('Speed Reader', 'Complete 10 articles in one day', 'clock', 'learning', 'uncommon',
 '{"type": "content_completed", "target": 10, "content_type": "article", "timeframe": "day"}', 40, 20),

('Skill Builder', 'Add 5 skills to your profile', 'tool', 'skill', 'common',
 '{"type": "skills_added", "target": 5}', 20, 10),

('Monthly Achiever', 'Spend 10 hours learning in a month', 'calendar', 'milestone', 'uncommon',
 '{"type": "learning_time_monthly", "target": 600, "unit": "minutes"}', 75, 35),

('Content Creator', 'Create your first insight', 'edit', 'engagement', 'common',
 '{"type": "insights_created", "target": 1}', 25, 15),

('Legend', 'Reach level 10', 'star', 'milestone', 'legendary',
 '{"type": "user_level", "target": 10}', 500, 250)

ON CONFLICT DO NOTHING;

-- Function to check achievement criteria
CREATE OR REPLACE FUNCTION check_achievement_criteria(
  p_user_id UUID,
  p_achievement_id UUID,
  p_user_stats JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  achievement_record RECORD;
  criteria JSONB;
  target_value INTEGER;
  current_value INTEGER;
  criteria_type TEXT;
BEGIN
  -- Get achievement details
  SELECT * FROM achievements WHERE id = p_achievement_id INTO achievement_record;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  criteria := achievement_record.criteria;
  criteria_type := criteria->>'type';
  target_value := (criteria->>'target')::INTEGER;
  
  -- Check different criteria types
  CASE criteria_type
    WHEN 'content_views' THEN
      current_value := COALESCE((p_user_stats->>'content_views')::INTEGER, 0);
    WHEN 'learning_streak' THEN
      current_value := COALESCE((p_user_stats->>'current_streak')::INTEGER, 0);
    WHEN 'saves_count' THEN
      current_value := COALESCE((p_user_stats->>'saves_count')::INTEGER, 0);
    WHEN 'comments_made' THEN
      current_value := COALESCE((p_user_stats->>'comments_made')::INTEGER, 0);
    WHEN 'total_xp' THEN
      current_value := COALESCE((p_user_stats->>'total_xp')::INTEGER, 0);
    WHEN 'skills_added' THEN
      current_value := COALESCE((p_user_stats->>'skills_count')::INTEGER, 0);
    WHEN 'learning_time_monthly' THEN
      current_value := COALESCE((p_user_stats->>'monthly_minutes')::INTEGER, 0);
    WHEN 'insights_created' THEN
      current_value := COALESCE((p_user_stats->>'insights_created')::INTEGER, 0);
    WHEN 'user_level' THEN
      current_value := COALESCE((p_user_stats->>'user_level')::INTEGER, 0);
    ELSE
      RETURN FALSE;
  END CASE;
  
  -- Update progress
  INSERT INTO user_achievement_progress (user_id, achievement_id, current_value, target_value, is_completed)
  VALUES (p_user_id, p_achievement_id, current_value, target_value, current_value >= target_value)
  ON CONFLICT (user_id, achievement_id) DO UPDATE SET
    current_value = EXCLUDED.current_value,
    is_completed = EXCLUDED.is_completed,
    updated_at = NOW();
  
  -- Return whether criteria is met
  RETURN current_value >= target_value;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award achievements for a user
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
  -- Gather user statistics
  SELECT jsonb_build_object(
    'content_views', COUNT(DISTINCT (content_type, content_id)),
    'saves_count', COUNT(*) FILTER (WHERE 'saved' = ANY(interaction_types)),
    'comments_made', (SELECT COUNT(*) FROM comments WHERE user_id = p_user_id) +
                    (SELECT COUNT(*) FROM insight_comments WHERE user_id = p_user_id),
    'current_streak', COALESCE((SELECT current_streak FROM user_streaks WHERE user_id = p_user_id AND is_active = true LIMIT 1), 0),
    'total_xp', COALESCE((SELECT xp FROM profiles WHERE id = p_user_id), 0),
    'skills_count', (SELECT COUNT(*) FROM user_skills WHERE user_id = p_user_id),
    'monthly_minutes', COALESCE((SELECT monthly_minutes_current FROM user_learning_analytics WHERE user_id = p_user_id), 0),
    'insights_created', (SELECT COUNT(*) FROM insights WHERE author_id = p_user_id),
    'user_level', COALESCE((SELECT level FROM profiles WHERE id = p_user_id), 1)
  ) FROM user_content_interactions WHERE user_id = p_user_id
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
      END IF;
      
      IF achievement_record.voltz_reward > 0 THEN
        UPDATE profiles 
        SET spendable_voltz = spendable_voltz + achievement_record.voltz_reward,
            total_voltz_earned = total_voltz_earned + achievement_record.voltz_reward
        WHERE id = p_user_id;
      END IF;
      
      awarded_count := awarded_count + 1;
    END IF;
  END LOOP;
  
  RETURN awarded_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's achievements for profile display
CREATE OR REPLACE FUNCTION get_user_achievements(
  p_user_id UUID,
  p_featured_only BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  icon_name TEXT,
  category TEXT,
  rarity TEXT,
  earned_at TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN,
  progress_current INTEGER,
  progress_total INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.title,
    ua.description,
    ua.icon_name,
    COALESCE(a.category, 'milestone'),
    COALESCE(a.rarity, 'common'),
    ua.earned_at,
    ua.is_featured,
    ua.progress_current,
    ua.progress_total
  FROM user_achievements ua
  LEFT JOIN achievements a ON ua.achievement_id = a.id
  WHERE ua.user_id = p_user_id
    AND (NOT p_featured_only OR ua.is_featured = true)
  ORDER BY ua.is_featured DESC, ua.earned_at DESC, ua.title
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get achievement progress for a user
CREATE OR REPLACE FUNCTION get_user_achievement_progress(p_user_id UUID)
RETURNS TABLE (
  achievement_id UUID,
  achievement_name TEXT,
  achievement_description TEXT,
  achievement_icon TEXT,
  current_value INTEGER,
  target_value INTEGER,
  progress_percentage DECIMAL,
  is_completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uap.achievement_id,
    a.name,
    a.description,
    a.icon_name,
    uap.current_value,
    uap.target_value,
    CASE 
      WHEN uap.target_value > 0 
      THEN ROUND((uap.current_value::DECIMAL / uap.target_value * 100), 2)
      ELSE 0
    END as progress_percentage,
    uap.is_completed
  FROM user_achievement_progress uap
  JOIN achievements a ON uap.achievement_id = a.id
  WHERE uap.user_id = p_user_id
    AND NOT uap.is_completed
    AND a.is_active = true
  ORDER BY progress_percentage DESC, a.name;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically check achievements when user data changes
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue achievement check (in a real system, this might be async)
  PERFORM check_and_award_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic achievement checking
-- (Note: In production, you might want to make this async to avoid performance issues)

-- Grant permissions
GRANT SELECT ON achievements TO authenticated;
GRANT SELECT ON achievement_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_achievement_progress TO authenticated;

COMMIT;

-- Usage Examples (for reference):
/*

-- Check and award achievements for a user
SELECT check_and_award_achievements('user-uuid');

-- Get user's featured achievements
SELECT * FROM get_user_achievements('user-uuid', true, 5);

-- Get user's achievement progress
SELECT * FROM get_user_achievement_progress('user-uuid');

-- Manually award an achievement
INSERT INTO user_achievements (user_id, achievement_id, title, description, icon_name, earned_at)
SELECT 'user-uuid', id, name, description, icon_name, NOW()
FROM achievements WHERE name = 'First Steps';

*/