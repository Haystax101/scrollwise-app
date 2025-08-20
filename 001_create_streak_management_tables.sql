-- Migration 001: Create Streak Management Tables
-- This migration creates dedicated tables for managing user learning streaks
-- Addresses the issue of streak goals being incorrectly stored in user_goals table

BEGIN;

-- Create user_streaks table for tracking streak goals and current progress
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL DEFAULT 'daily_learning' CHECK (streak_type IN ('daily_learning', 'weekly_content', 'monthly_engagement')),
  target_days INTEGER NOT NULL CHECK (target_days > 0), -- e.g., 7 for weekly goal
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE,
  streak_goal_set_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, streak_type) -- One streak goal per type per user
);

-- Create daily activity tracking table for accurate streak calculation
CREATE TABLE IF NOT EXISTS user_daily_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_types TEXT[] DEFAULT '{}', -- ['content_view', 'quiz_completed', 'comment_made', 'insight_created']
  total_minutes_active INTEGER DEFAULT 0 CHECK (total_minutes_active >= 0),
  unique_content_pieces INTEGER DEFAULT 0 CHECK (unique_content_pieces >= 0),
  interactions_count INTEGER DEFAULT 0 CHECK (interactions_count >= 0),
  quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score BETWEEN 0.0 AND 10.0), -- Quality of engagement
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_date) -- One record per user per day
);

-- Create indexes for performance
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_active ON user_streaks(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_streaks_type ON user_streaks(user_id, streak_type);

CREATE INDEX idx_daily_activities_user_date ON user_daily_activities(user_id, activity_date DESC);
-- Removed date range index with CURRENT_DATE as it's not immutable
CREATE INDEX idx_daily_activities_recent ON user_daily_activities(activity_date DESC);

-- Add RLS policies for security
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_activities ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own streak data
CREATE POLICY "Users can view their own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks" ON user_streaks
  FOR DELETE USING (auth.uid() = user_id);

-- Daily activities policies
CREATE POLICY "Users can view their own daily activities" ON user_daily_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily activities" ON user_daily_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily activities" ON user_daily_activities
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update streak when activity is recorded
CREATE OR REPLACE FUNCTION update_user_streak_on_activity()
RETURNS TRIGGER AS $$
DECLARE
  streak_record RECORD;
  days_since_last_activity INTEGER;
  consecutive_days INTEGER;
BEGIN
  -- For each active streak for this user
  FOR streak_record IN 
    SELECT * FROM user_streaks 
    WHERE user_id = NEW.user_id AND is_active = true
  LOOP
    -- Calculate days since last activity
    IF streak_record.last_activity_date IS NULL THEN
      days_since_last_activity := 0;
    ELSE
      days_since_last_activity := NEW.activity_date - streak_record.last_activity_date;
    END IF;
    
    -- Update streak based on activity pattern
    IF days_since_last_activity = 0 THEN
      -- Same day activity, don't change streak count
      consecutive_days := streak_record.current_streak;
    ELSIF days_since_last_activity = 1 THEN
      -- Consecutive day, increment streak
      consecutive_days := streak_record.current_streak + 1;
    ELSIF days_since_last_activity > 1 THEN
      -- Streak broken, reset to 1
      consecutive_days := 1;
    ELSE
      -- Future date or negative (shouldn't happen), keep current
      consecutive_days := streak_record.current_streak;
    END IF;
    
    -- Update the streak record
    UPDATE user_streaks 
    SET 
      current_streak = consecutive_days,
      longest_streak = GREATEST(longest_streak, consecutive_days),
      last_activity_date = NEW.activity_date,
      updated_at = NOW()
    WHERE id = streak_record.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update streaks
CREATE TRIGGER trigger_update_streaks_on_activity
  AFTER INSERT OR UPDATE ON user_daily_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak_on_activity();

-- Helper function to set up initial streak for new users
CREATE OR REPLACE FUNCTION setup_user_learning_streak(
  p_user_id UUID,
  p_target_days INTEGER DEFAULT 7,
  p_streak_type TEXT DEFAULT 'daily_learning'
) RETURNS UUID AS $$
DECLARE
  streak_id UUID;
BEGIN
  INSERT INTO user_streaks (user_id, streak_type, target_days)
  VALUES (p_user_id, p_streak_type, p_target_days)
  ON CONFLICT (user_id, streak_type) DO UPDATE
  SET 
    target_days = EXCLUDED.target_days,
    updated_at = NOW()
  RETURNING id INTO streak_id;
  
  RETURN streak_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record daily activity (to be called from app)
CREATE OR REPLACE FUNCTION record_daily_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_minutes_active INTEGER DEFAULT 1,
  p_quality_score DECIMAL DEFAULT 1.0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_daily_activities (
    user_id, 
    activity_date, 
    activity_types,
    total_minutes_active,
    interactions_count,
    quality_score
  ) VALUES (
    p_user_id,
    CURRENT_DATE,
    ARRAY[p_activity_type],
    p_minutes_active,
    1,
    p_quality_score
  )
  ON CONFLICT (user_id, activity_date) DO UPDATE SET
    activity_types = CASE 
      WHEN p_activity_type = ANY(user_daily_activities.activity_types) 
      THEN user_daily_activities.activity_types
      ELSE array_append(user_daily_activities.activity_types, p_activity_type)
    END,
    total_minutes_active = user_daily_activities.total_minutes_active + p_minutes_active,
    interactions_count = user_daily_activities.interactions_count + 1,
    quality_score = GREATEST(user_daily_activities.quality_score, p_quality_score),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_streaks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_daily_activities TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

COMMIT;

-- Usage Examples (for reference):
/*

-- Set up a weekly learning streak for a user
SELECT setup_user_learning_streak('user-uuid-here', 7);

-- Record daily activity
SELECT record_daily_activity('user-uuid-here', 'content_view', 15, 3.5);
SELECT record_daily_activity('user-uuid-here', 'quiz_completed', 5, 8.0);

-- Query user's current streaks
SELECT 
  streak_type,
  target_days,
  current_streak,
  longest_streak,
  CASE 
    WHEN current_streak >= target_days THEN 'Goal Achieved!'
    WHEN current_streak = 0 THEN 'Start Your Streak'
    ELSE (target_days - current_streak) || ' more days to goal'
  END as progress_message
FROM user_streaks 
WHERE user_id = 'user-uuid-here' AND is_active = true;

*/