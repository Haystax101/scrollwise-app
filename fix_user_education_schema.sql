-- Fix user_education table schema to match the application requirements
-- Add missing columns that the ProfileCustomizationSections component expects

BEGIN;

-- Add missing columns to user_education table
DO $$ 
BEGIN
  -- Add is_current column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'is_current') THEN
    ALTER TABLE user_education ADD COLUMN is_current BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'start_date') THEN
    ALTER TABLE user_education ADD COLUMN start_date DATE;
  END IF;
  
  -- Add end_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'end_date') THEN
    ALTER TABLE user_education ADD COLUMN end_date DATE;
  END IF;
  
  -- Ensure field_of_study column exists (this should already be added from previous migration)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'field_of_study') THEN
    ALTER TABLE user_education ADD COLUMN field_of_study TEXT;
    
    -- Copy existing major data to field_of_study for backwards compatibility
    UPDATE user_education SET field_of_study = major WHERE major IS NOT NULL;
  END IF;
END $$;

-- Add similar columns to user_experiences table (in case they're missing)
DO $$ 
BEGIN
  -- Add is_current column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'is_current') THEN
    ALTER TABLE user_experiences ADD COLUMN is_current BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'start_date') THEN
    ALTER TABLE user_experiences ADD COLUMN start_date DATE;
  END IF;
  
  -- Add end_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'end_date') THEN
    ALTER TABLE user_experiences ADD COLUMN end_date DATE;
  END IF;
  
  -- Add employment_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_experiences' AND column_name = 'employment_type') THEN
    ALTER TABLE user_experiences ADD COLUMN employment_type TEXT DEFAULT 'full-time';
  END IF;
END $$;

-- Add columns to user_projects table (in case they're missing)
DO $$ 
BEGIN
  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'start_date') THEN
    ALTER TABLE user_projects ADD COLUMN start_date DATE;
  END IF;
  
  -- Add end_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'end_date') THEN
    ALTER TABLE user_projects ADD COLUMN end_date DATE;
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_projects' AND column_name = 'status') THEN
    ALTER TABLE user_projects ADD COLUMN status TEXT DEFAULT 'completed';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_education_current ON user_education(user_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_user_experiences_current ON user_experiences(user_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects(user_id, status);

-- Update any existing records to set sensible defaults
UPDATE user_education SET is_current = FALSE WHERE is_current IS NULL;
UPDATE user_experiences SET is_current = FALSE WHERE is_current IS NULL;
UPDATE user_projects SET status = 'completed' WHERE status IS NULL;

COMMIT;

-- Verify the changes
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_education', 'user_experiences', 'user_projects')
  AND column_name IN ('is_current', 'start_date', 'end_date', 'field_of_study', 'employment_type', 'status')
ORDER BY table_name, column_name;