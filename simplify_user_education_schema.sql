-- Simplify user_education table to use text fields instead of foreign key relationships
-- This removes the complexity of maintaining separate degree and university tables

BEGIN;

-- First, let's see what the current structure looks like
-- and then modify it to use simple text fields

DO $$ 
BEGIN
  -- Add degree_name column if it doesn't exist (as TEXT instead of foreign key)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'degree_name') THEN
    ALTER TABLE user_education ADD COLUMN degree_name TEXT;
  END IF;
  
  -- Add university_name column if it doesn't exist (as TEXT instead of foreign key)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'university_name') THEN
    ALTER TABLE user_education ADD COLUMN university_name TEXT;
  END IF;
  
  -- Make degree_id nullable if it exists (to remove the not-null constraint)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'degree_id') THEN
    ALTER TABLE user_education ALTER COLUMN degree_id DROP NOT NULL;
  END IF;
  
  -- Make university_id nullable if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'university_id') THEN
    ALTER TABLE user_education ALTER COLUMN university_id DROP NOT NULL;
  END IF;
END $$;

-- Migrate existing data from foreign keys to text fields (if any exists)
DO $$
BEGIN
  -- Migrate degree data if the tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'degrees') THEN
    UPDATE user_education 
    SET degree_name = d.name 
    FROM degrees d 
    WHERE user_education.degree_id = d.id 
      AND user_education.degree_name IS NULL;
  END IF;
  
  -- Migrate university data if the tables exist  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'universities') THEN
    UPDATE user_education 
    SET university_name = u.name 
    FROM universities u 
    WHERE user_education.university_id = u.id 
      AND user_education.university_name IS NULL;
  END IF;
END $$;

-- Create indexes for the new text fields
CREATE INDEX IF NOT EXISTS idx_user_education_degree_name ON user_education(degree_name);
CREATE INDEX IF NOT EXISTS idx_user_education_university_name ON user_education(university_name);

-- Update RLS policies if they exist
DO $$
BEGIN
  -- Ensure RLS is enabled
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_education' AND relrowsecurity = true) THEN
    ALTER TABLE user_education ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Create or update RLS policy for user_education
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_education' AND policyname = 'Users can manage their own education') THEN
    CREATE POLICY "Users can manage their own education" ON user_education FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_education TO authenticated;

COMMIT;

-- Verify the final structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_education'
ORDER BY ordinal_position;