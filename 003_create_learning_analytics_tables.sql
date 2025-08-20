-- Migration 003: Create Learning Analytics Tables
-- This migration creates tables for accurate time tracking and learning analytics
-- Addresses issues with inaccurate "time spent learning" and content engagement metrics

BEGIN;

-- Create detailed learning session tracking table
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'paper', 'book', 'insight', 'quiz', 'video')),
  content_id BIGINT NOT NULL,
  session_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER CHECK (duration_seconds >= 0),
  interaction_events JSONB DEFAULT '[]'::jsonb, -- Track scroll, pause, resume, highlight events
  completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  engagement_score DECIMAL(3,2) DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 10), -- Quality of engagement
  session_quality_score INTEGER CHECK (session_quality_score BETWEEN 1 AND 10),
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  referrer_source TEXT, -- How user arrived at content
  notes TEXT, -- User notes taken during session
  bookmarks JSONB DEFAULT '[]'::jsonb, -- Specific content bookmarks/highlights
  quiz_score INTEGER CHECK (quiz_score BETWEEN 0 AND 100), -- For quiz sessions
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning analytics summary table (computed/cached metrics)
CREATE TABLE IF NOT EXISTS user_learning_analytics (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_learning_time_minutes INTEGER DEFAULT 0 CHECK (total_learning_time_minutes >= 0),
  total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
  active_learning_days INTEGER DEFAULT 0 CHECK (active_learning_days >= 0),
  avg_session_duration_minutes DECIMAL(8,2) DEFAULT 0 CHECK (avg_session_duration_minutes >= 0),
  content_completion_rate DECIMAL(5,2) DEFAULT 0 CHECK (content_completion_rate BETWEEN 0 AND 100),
  preferred_learning_times INTEGER[] DEFAULT '{}', -- Hours of day [9,10,14,15] when most active
  most_engaged_content_types TEXT[] DEFAULT '{}', -- Ranked by engagement
  learning_streak_days INTEGER DEFAULT 0 CHECK (learning_streak_days >= 0),
  weekly_learning_goal_completion DECIMAL(5,2) DEFAULT 0 CHECK (weekly_learning_goal_completion BETWEEN 0 AND 200),
  monthly_minutes_target INTEGER DEFAULT 480, -- 8 hours default monthly target
  monthly_minutes_current INTEGER DEFAULT 0,
  total_unique_content_pieces INTEGER DEFAULT 0,
  favorite_topics TEXT[] DEFAULT '{}', -- Based on most engaged industries/tags
  learning_velocity DECIMAL(5,2) DEFAULT 0, -- Content pieces per week
  retention_score DECIMAL(5,2) DEFAULT 0, -- Based on quiz performance and revisits
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content interaction summary (for efficient querying)
CREATE TABLE IF NOT EXISTS user_content_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'paper', 'book', 'insight', 'quiz', 'video')),
  content_id BIGINT NOT NULL,
  interaction_types TEXT[] DEFAULT '{}', -- ['viewed', 'liked', 'saved', 'commented', 'shared']
  first_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_time_spent_seconds INTEGER DEFAULT 0 CHECK (total_time_spent_seconds >= 0),
  interaction_count INTEGER DEFAULT 1 CHECK (interaction_count >= 0),
  completion_status TEXT DEFAULT 'started' CHECK (completion_status IN ('started', 'in_progress', 'completed', 'abandoned')),
  engagement_score DECIMAL(3,2) DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id) -- One record per user per content piece
);

-- Create learning goals tracking (separate from streaks)
CREATE TABLE IF NOT EXISTS user_learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('minutes_weekly', 'content_weekly', 'topics_monthly', 'completion_rate')),
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  current_value INTEGER DEFAULT 0 CHECK (current_value >= 0),
  tracking_period TEXT NOT NULL CHECK (tracking_period IN ('weekly', 'monthly', 'quarterly')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  achievement_rate DECIMAL(5,2) DEFAULT 0 CHECK (achievement_rate BETWEEN 0 AND 200), -- Can exceed 100%
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance (with IF NOT EXISTS equivalent)
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_time ON learning_sessions(user_id, session_start_time DESC);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_content ON learning_sessions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_date_range ON learning_sessions(session_start_time);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_completed ON learning_sessions(user_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_content_interactions_user ON user_content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_content ON user_content_interactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_recent ON user_content_interactions(user_id, last_interaction_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_goals_user_active ON user_learning_goals(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_learning_goals_period ON user_learning_goals(tracking_period, start_date, end_date);

-- Add RLS policies (drop existing ones first)
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own learning sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Users can manage their own learning sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Users can view their own analytics" ON user_learning_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON user_learning_analytics;
DROP POLICY IF EXISTS "Users can view their own interactions" ON user_content_interactions;
DROP POLICY IF EXISTS "Users can manage their own interactions" ON user_content_interactions;
DROP POLICY IF EXISTS "Users can view their own learning goals" ON user_learning_goals;
DROP POLICY IF EXISTS "Users can manage their own learning goals" ON user_learning_goals;

-- Learning sessions policies
CREATE POLICY "Users can view their own learning sessions" ON learning_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own learning sessions" ON learning_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Analytics policies (read-only from app perspective)
CREATE POLICY "Users can view their own analytics" ON user_learning_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update analytics" ON user_learning_analytics
  FOR ALL USING (auth.uid() = user_id); -- Updated by functions

-- Content interactions policies
CREATE POLICY "Users can view their own interactions" ON user_content_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interactions" ON user_content_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Learning goals policies
CREATE POLICY "Users can view their own learning goals" ON user_learning_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own learning goals" ON user_learning_goals
  FOR ALL USING (auth.uid() = user_id);

-- Function to start a learning session
CREATE OR REPLACE FUNCTION start_learning_session(
  p_user_id UUID,
  p_content_type TEXT,
  p_content_id BIGINT,
  p_device_type TEXT DEFAULT 'mobile',
  p_referrer_source TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO learning_sessions (
    user_id, content_type, content_id, device_type, referrer_source, session_start_time
  ) VALUES (
    p_user_id, p_content_type, p_content_id, p_device_type, p_referrer_source, NOW()
  ) RETURNING id INTO session_id;
  
  -- Update or create content interaction record
  INSERT INTO user_content_interactions (
    user_id, content_type, content_id, interaction_types, first_interaction_at, last_interaction_at
  ) VALUES (
    p_user_id, p_content_type, p_content_id, ARRAY['viewed'], NOW(), NOW()
  ) ON CONFLICT (user_id, content_type, content_id) DO UPDATE SET
    interaction_types = CASE 
      WHEN 'viewed' = ANY(user_content_interactions.interaction_types) 
      THEN user_content_interactions.interaction_types
      ELSE array_append(user_content_interactions.interaction_types, 'viewed')
    END,
    last_interaction_at = NOW(),
    interaction_count = user_content_interactions.interaction_count + 1,
    updated_at = NOW();
    
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to end a learning session
CREATE OR REPLACE FUNCTION end_learning_session(
  p_session_id UUID,
  p_completion_percentage DECIMAL DEFAULT 100,
  p_engagement_score DECIMAL DEFAULT 5.0,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  session_record RECORD;
  duration_sec INTEGER;
BEGIN
  -- Get session details and update end time
  UPDATE learning_sessions 
  SET 
    session_end_time = NOW(),
    completion_percentage = p_completion_percentage,
    engagement_score = p_engagement_score,
    notes = p_notes,
    is_completed = (p_completion_percentage >= 80), -- 80% completion threshold
    updated_at = NOW()
  WHERE id = p_session_id
  RETURNING * INTO session_record;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate duration
  duration_sec := EXTRACT(EPOCH FROM (session_record.session_end_time - session_record.session_start_time));
  
  -- Update duration
  UPDATE learning_sessions 
  SET duration_seconds = duration_sec
  WHERE id = p_session_id;
  
  -- Update content interactions
  UPDATE user_content_interactions 
  SET 
    total_time_spent_seconds = total_time_spent_seconds + duration_sec,
    completion_status = CASE 
      WHEN p_completion_percentage >= 95 THEN 'completed'
      WHEN p_completion_percentage >= 20 THEN 'in_progress'
      WHEN p_completion_percentage < 20 AND total_time_spent_seconds + duration_sec < 30 THEN 'abandoned'
      ELSE completion_status
    END,
    engagement_score = GREATEST(engagement_score, p_engagement_score),
    updated_at = NOW()
  WHERE user_id = session_record.user_id 
    AND content_type = session_record.content_type 
    AND content_id = session_record.content_id;
  
  -- Record daily activity for streak calculation
  PERFORM record_daily_activity(
    session_record.user_id,
    'content_view',
    GREATEST(1, duration_sec / 60), -- Convert to minutes
    p_engagement_score
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh user analytics (run periodically)
CREATE OR REPLACE FUNCTION refresh_user_learning_analytics(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  analytics_data RECORD;
  current_month_start DATE;
BEGIN
  current_month_start := date_trunc('month', CURRENT_DATE)::date;
  
  -- Calculate analytics from learning sessions
  SELECT 
    COALESCE(SUM(duration_seconds), 0) / 60 as total_minutes,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT DATE(session_start_time)) as active_days,
    COALESCE(AVG(duration_seconds), 0) / 60 as avg_duration_minutes,
    COALESCE(AVG(completion_percentage), 0) as avg_completion_rate,
    COALESCE(SUM(CASE WHEN session_start_time >= current_month_start THEN duration_seconds ELSE 0 END), 0) / 60 as monthly_minutes
  FROM learning_sessions 
  WHERE user_id = p_user_id AND session_end_time IS NOT NULL
  INTO analytics_data;
  
  -- Upsert analytics record
  INSERT INTO user_learning_analytics (
    user_id,
    total_learning_time_minutes,
    total_sessions,
    active_learning_days,
    avg_session_duration_minutes,
    content_completion_rate,
    monthly_minutes_current,
    last_calculated_at,
    updated_at
  ) VALUES (
    p_user_id,
    COALESCE(analytics_data.total_minutes, 0),
    COALESCE(analytics_data.total_sessions, 0),
    COALESCE(analytics_data.active_days, 0),
    COALESCE(analytics_data.avg_duration_minutes, 0),
    COALESCE(analytics_data.avg_completion_rate, 0),
    COALESCE(analytics_data.monthly_minutes, 0),
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    total_learning_time_minutes = EXCLUDED.total_learning_time_minutes,
    total_sessions = EXCLUDED.total_sessions,
    active_learning_days = EXCLUDED.active_learning_days,
    avg_session_duration_minutes = EXCLUDED.avg_session_duration_minutes,
    content_completion_rate = EXCLUDED.content_completion_rate,
    monthly_minutes_current = EXCLUDED.monthly_minutes_current,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get user learning stats (for profile display)
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id UUID)
RETURNS TABLE (
  time_spent_learning TEXT,
  total_interactions INTEGER,
  content_engaged INTEGER,
  completion_rate DECIMAL,
  active_streak INTEGER,
  monthly_progress DECIMAL
) AS $$
DECLARE
  analytics RECORD;
  interactions_count INTEGER;
  unique_content INTEGER;
  current_streak INTEGER;
BEGIN
  -- Get analytics data
  SELECT * FROM user_learning_analytics WHERE user_id = p_user_id INTO analytics;
  
  -- Get interaction counts
  SELECT 
    COUNT(*) as interactions,
    COUNT(DISTINCT (content_type, content_id)) as unique_content
  FROM user_content_interactions 
  WHERE user_id = p_user_id
  INTO interactions_count, unique_content;
  
  -- Get current streak
  SELECT COALESCE(us.current_streak, 0) FROM user_streaks us
  WHERE us.user_id = p_user_id AND us.is_active = true 
  LIMIT 1 INTO current_streak;
  
  -- Format and return results
  RETURN QUERY SELECT
    CASE 
      WHEN COALESCE(analytics.total_learning_time_minutes, 0) >= 60 
      THEN (analytics.total_learning_time_minutes / 60) || 'h ' || (analytics.total_learning_time_minutes % 60) || 'm'
      ELSE COALESCE(analytics.total_learning_time_minutes, 0) || 'm'
    END as time_spent_learning,
    COALESCE(interactions_count, 0) as total_interactions,
    COALESCE(unique_content, 0) as content_engaged,
    COALESCE(analytics.content_completion_rate, 0) as completion_rate,
    COALESCE(current_streak, 0) as active_streak,
    CASE 
      WHEN COALESCE(analytics.monthly_minutes_target, 480) > 0 
      THEN (COALESCE(analytics.monthly_minutes_current, 0)::DECIMAL / analytics.monthly_minutes_target * 100)
      ELSE 0
    END as monthly_progress;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON learning_sessions TO authenticated;
GRANT SELECT, UPDATE ON user_learning_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_content_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_learning_goals TO authenticated;

COMMIT;

-- Usage Examples (for reference):
/*

-- Start a learning session
SELECT start_learning_session('user-uuid', 'article', 123, 'mobile', 'feed');

-- End a learning session
SELECT end_learning_session('session-uuid', 85.5, 7.2, 'Great article about AI!');

-- Refresh user analytics
SELECT refresh_user_learning_analytics('user-uuid');

-- Get learning stats for profile
SELECT * FROM get_user_learning_stats('user-uuid');

-- Set a weekly learning goal
INSERT INTO user_learning_goals (user_id, goal_type, target_value, tracking_period)
VALUES ('user-uuid', 'minutes_weekly', 180, 'weekly'); -- 3 hours per week

*/