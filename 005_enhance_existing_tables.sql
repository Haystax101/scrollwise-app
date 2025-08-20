-- Migration 005: Enhance Existing Tables
-- This migration adds columns and improvements to existing tables
-- Enhances user_goals, user_experiences, user_education, user_projects, and profile_sections

BEGIN;

-- Enhance user_goals table to properly separate career goals from streak goals
DO $$ 
BEGIN
  -- Add goal_type to distinguish between career goals and other types
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'goal_type') THEN
    ALTER TABLE user_goals ADD COLUMN goal_type TEXT DEFAULT 'career' CHECK (goal_type IN ('career', 'learning', 'skill', 'project'));
  END IF;
  
  -- Add priority for goal ranking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'priority') THEN
    ALTER TABLE user_goals ADD COLUMN priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5);
  END IF;
  
  -- Add status tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'status') THEN
    ALTER TABLE user_goals ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled'));
  END IF;
  
  -- Add target date for time-bound goals
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'target_date') THEN
    ALTER TABLE user_goals ADD COLUMN target_date DATE;
  END IF;
  
  -- Add description for detailed goal context
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'description') THEN
    ALTER TABLE user_goals ADD COLUMN description TEXT;
  END IF;
  
  -- Add progress tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'progress_percentage') THEN
    ALTER TABLE user_goals ADD COLUMN progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100);
  END IF;
  
  -- Add timestamps
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'created_at') THEN
    ALTER TABLE user_goals ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'updated_at') THEN
    ALTER TABLE user_goals ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'completed_at') THEN
    ALTER TABLE user_goals ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Enhance user_experiences table for richer work experience data
DO $$ 
BEGIN
  -- Add position title separate from description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'position_title') THEN
    ALTER TABLE user_experiences ADD COLUMN position_title TEXT;
  END IF;
  
  -- Add date fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'start_date') THEN
    ALTER TABLE user_experiences ADD COLUMN start_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'end_date') THEN
    ALTER TABLE user_experiences ADD COLUMN end_date DATE;
  END IF;
  
  -- Add current position indicator
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'is_current') THEN
    ALTER TABLE user_experiences ADD COLUMN is_current BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add company details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'company_logo_url') THEN
    ALTER TABLE user_experiences ADD COLUMN company_logo_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'location') THEN
    ALTER TABLE user_experiences ADD COLUMN location TEXT;
  END IF;
  
  -- Add structured responsibilities and achievements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'responsibilities') THEN
    ALTER TABLE user_experiences ADD COLUMN responsibilities TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'key_achievements') THEN
    ALTER TABLE user_experiences ADD COLUMN key_achievements TEXT[];
  END IF;
  
  -- Add employment type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'employment_type') THEN
    ALTER TABLE user_experiences ADD COLUMN employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'freelance', 'volunteer'));
  END IF;
  
  -- Add industry field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'industry') THEN
    ALTER TABLE user_experiences ADD COLUMN industry TEXT;
  END IF;
  
  -- Add skills gained
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'skills_gained') THEN
    ALTER TABLE user_experiences ADD COLUMN skills_gained TEXT[];
  END IF;
  
  -- Add timestamps
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'created_at') THEN
    ALTER TABLE user_experiences ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'updated_at') THEN
    ALTER TABLE user_experiences ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Enhance user_education table for better education tracking
DO $$ 
BEGIN
  -- Add degree name override
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'degree_name') THEN
    ALTER TABLE user_education ADD COLUMN degree_name TEXT;
  END IF;
  
  -- Add major and minor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'major') THEN
    ALTER TABLE user_education ADD COLUMN major TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'minor') THEN
    ALTER TABLE user_education ADD COLUMN minor TEXT;
  END IF;
  
  -- Add date fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'start_date') THEN
    ALTER TABLE user_education ADD COLUMN start_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'end_date') THEN
    ALTER TABLE user_education ADD COLUMN end_date DATE;
  END IF;
  
  -- Add GPA
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'gpa') THEN
    ALTER TABLE user_education ADD COLUMN gpa DECIMAL(3,2) CHECK (gpa >= 0 AND gpa <= 4.0);
  END IF;
  
  -- Add honors and activities
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'honors') THEN
    ALTER TABLE user_education ADD COLUMN honors TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'activities') THEN
    ALTER TABLE user_education ADD COLUMN activities TEXT[];
  END IF;
  
  -- Add relevant coursework
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'relevant_coursework') THEN
    ALTER TABLE user_education ADD COLUMN relevant_coursework TEXT[];
  END IF;
  
  -- Add graduation status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'graduation_status') THEN
    ALTER TABLE user_education ADD COLUMN graduation_status TEXT DEFAULT 'graduated' CHECK (graduation_status IN ('graduated', 'in_progress', 'dropped_out', 'transferred'));
  END IF;
  
  -- Add timestamps
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'created_at') THEN
    ALTER TABLE user_education ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'updated_at') THEN
    ALTER TABLE user_education ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Enhance user_projects table for better project showcase
DO $$ 
BEGIN
  -- Add date fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'start_date') THEN
    ALTER TABLE user_projects ADD COLUMN start_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'end_date') THEN
    ALTER TABLE user_projects ADD COLUMN end_date DATE;
  END IF;
  
  -- Add status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'status') THEN
    ALTER TABLE user_projects ADD COLUMN status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'paused', 'cancelled'));
  END IF;
  
  -- Add URLs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'project_url') THEN
    ALTER TABLE user_projects ADD COLUMN project_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'github_url') THEN
    ALTER TABLE user_projects ADD COLUMN github_url TEXT;
  END IF;
  
  -- Add technologies used
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'technologies') THEN
    ALTER TABLE user_projects ADD COLUMN technologies TEXT[];
  END IF;
  
  -- Add featured flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'is_featured') THEN
    ALTER TABLE user_projects ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add team information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'team_size') THEN
    ALTER TABLE user_projects ADD COLUMN team_size INTEGER CHECK (team_size >= 1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'role_in_project') THEN
    ALTER TABLE user_projects ADD COLUMN role_in_project TEXT;
  END IF;
  
  -- Add project category
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'project_category') THEN
    ALTER TABLE user_projects ADD COLUMN project_category TEXT CHECK (project_category IN ('web_app', 'mobile_app', 'api', 'data_analysis', 'research', 'design', 'other'));
  END IF;
  
  -- Add key achievements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'key_outcomes') THEN
    ALTER TABLE user_projects ADD COLUMN key_outcomes TEXT[];
  END IF;
  
  -- Add timestamps
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'created_at') THEN
    ALTER TABLE user_projects ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'updated_at') THEN
    ALTER TABLE user_projects ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Enhance profile_sections for better organization
DO $$ 
BEGIN
  -- Add public/private flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_sections' AND column_name = 'is_public') THEN
    ALTER TABLE profile_sections ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
  END IF;
  
  -- Add display order
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_sections' AND column_name = 'display_order') THEN
    ALTER TABLE profile_sections ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
  
  -- Add structured schema support
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_sections' AND column_name = 'section_schema') THEN
    ALTER TABLE profile_sections ADD COLUMN section_schema JSONB;
  END IF;
  
  -- Add title field for custom sections
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_sections' AND column_name = 'title') THEN
    ALTER TABLE profile_sections ADD COLUMN title TEXT;
  END IF;
  
  -- Add created_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_sections' AND column_name = 'created_at') THEN
    ALTER TABLE profile_sections ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add total_voltz_earned to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_voltz_earned') THEN
    ALTER TABLE profiles ADD COLUMN total_voltz_earned INTEGER DEFAULT 100;
  END IF;
END $$;

-- Create improved indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user_type_status ON user_goals(user_id, goal_type, status);
CREATE INDEX IF NOT EXISTS idx_user_goals_target_date ON user_goals(user_id, target_date) WHERE target_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_goals_priority ON user_goals(user_id, priority DESC);

CREATE INDEX IF NOT EXISTS idx_user_experiences_user_current ON user_experiences(user_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_user_experiences_dates ON user_experiences(user_id, start_date DESC, end_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_experiences_company ON user_experiences(user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_user_education_user_status ON user_education(user_id, graduation_status);
CREATE INDEX IF NOT EXISTS idx_user_education_dates ON user_education(user_id, start_date DESC, end_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_projects_user_featured ON user_projects(user_id, is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_user_projects_user_status ON user_projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_projects_dates ON user_projects(user_id, start_date DESC, end_date DESC);

CREATE INDEX IF NOT EXISTS idx_profile_sections_user_type_order ON profile_sections(user_id, section_type, display_order);
CREATE INDEX IF NOT EXISTS idx_profile_sections_public ON profile_sections(user_id, is_public) WHERE is_public = true;

-- Functions to help with data migration and management

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress(
  p_goal_id UUID,
  p_progress_percentage DECIMAL
) RETURNS VOID AS $$
BEGIN
  UPDATE user_goals 
  SET 
    progress_percentage = p_progress_percentage,
    status = CASE 
      WHEN p_progress_percentage >= 100 THEN 'completed'
      WHEN p_progress_percentage > 0 THEN 'active'
      ELSE status
    END,
    completed_at = CASE 
      WHEN p_progress_percentage >= 100 THEN NOW()
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's professional summary
CREATE OR REPLACE FUNCTION get_user_professional_summary(p_user_id UUID)
RETURNS TABLE (
  current_position TEXT,
  current_company TEXT,
  years_experience DECIMAL,
  top_skills TEXT[],
  education_level TEXT,
  featured_projects INTEGER,
  active_goals INTEGER
) AS $$
DECLARE
  experience_years DECIMAL;
  current_job RECORD;
  education_record RECORD;
  skills_array TEXT[];
BEGIN
  -- Get current position
  SELECT position_title, c.name as company_name
  FROM user_experiences ue
  LEFT JOIN companies c ON ue.company_id = c.id
  WHERE ue.user_id = p_user_id AND ue.is_current = true
  LIMIT 1 INTO current_job;
  
  -- Calculate years of experience
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN end_date IS NULL AND is_current = true 
        THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))
        WHEN end_date IS NOT NULL 
        THEN EXTRACT(YEAR FROM AGE(end_date, start_date))
        ELSE 0
      END
    ), 0
  ) FROM user_experiences 
  WHERE user_id = p_user_id AND start_date IS NOT NULL
  INTO experience_years;
  
  -- Get highest education
  SELECT degree_name, u.name as university_name
  FROM user_education ue
  LEFT JOIN universities u ON ue.university_id = u.id
  WHERE ue.user_id = p_user_id
  ORDER BY end_date DESC NULLS LAST
  LIMIT 1 INTO education_record;
  
  -- Get top skills
  SELECT ARRAY_AGG(skill_name ORDER BY endorsement_count DESC, proficiency_level DESC)
  FROM user_skills
  WHERE user_id = p_user_id AND is_featured = true
  LIMIT 5 INTO skills_array;
  
  -- Return summary
  RETURN QUERY SELECT
    COALESCE(current_job.position_title, 'Not specified'),
    COALESCE(current_job.company_name, 'Not specified'),
    experience_years,
    COALESCE(skills_array, ARRAY[]::TEXT[]),
    COALESCE(education_record.degree_name || ' from ' || education_record.university_name, 'Not specified'),
    (SELECT COUNT(*)::INTEGER FROM user_projects WHERE user_id = p_user_id AND is_featured = true),
    (SELECT COUNT(*)::INTEGER FROM user_goals WHERE user_id = p_user_id AND status = 'active');
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_goal_progress(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_professional_summary(UUID) TO authenticated;

COMMIT;

-- Usage Examples (for reference):
/*

-- Update a goal's progress
SELECT update_goal_progress('goal-uuid', 75.5);

-- Get professional summary
SELECT * FROM get_user_professional_summary('user-uuid');

-- Add a new work experience
INSERT INTO user_experiences (
  user_id, company_id, position_title, start_date, is_current, 
  employment_type, location, responsibilities, key_achievements
) VALUES (
  'user-uuid', 'company-uuid', 'Senior Developer', '2023-01-15', true,
  'full_time', 'San Francisco, CA', 
  ARRAY['Lead development team', 'Architect solutions', 'Mentor junior developers'],
  ARRAY['Increased performance by 40%', 'Led team of 5 developers']
);

-- Add a new project
INSERT INTO user_projects (
  user_id, title, description, start_date, end_date, status,
  project_url, technologies, is_featured, role_in_project
) VALUES (
  'user-uuid', 'E-commerce Platform', 'Built scalable e-commerce solution',
  '2023-01-01', '2023-06-01', 'completed',
  'https://myproject.com', ARRAY['React', 'Node.js', 'PostgreSQL'],
  true, 'Full-stack Developer'
);

*/