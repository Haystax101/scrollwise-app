-- Fix for two profile-related errors:
-- 1. user_education.field_of_study column doesn't exist (should be 'major')
-- 2. Industries UUID error (need proper industry lookup table)

BEGIN;

-- Fix 1: Add missing field_of_study column to user_education table as alias to major
-- OR we can just use the existing 'major' field if preferred
DO $$ 
BEGIN
  -- Add field_of_study column if it doesn't exist (maps to the same concept as major)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_education' AND column_name = 'field_of_study') THEN
    ALTER TABLE user_education ADD COLUMN field_of_study TEXT;
    
    -- Copy existing major data to field_of_study for backwards compatibility
    UPDATE user_education SET field_of_study = major WHERE major IS NOT NULL;
  END IF;
END $$;

-- Fix 2: Enhance existing industries table with missing fields
-- The industries table already exists, so we'll just add missing fields and populate data
DO $$ 
BEGIN
  -- Add category field if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industries' AND column_name = 'category') THEN
    ALTER TABLE industries ADD COLUMN category TEXT;
  END IF;
  
  -- Add is_popular field if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industries' AND column_name = 'is_popular') THEN
    ALTER TABLE industries ADD COLUMN is_popular BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add created_at field if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industries' AND column_name = 'created_at') THEN
    ALTER TABLE industries ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add updated_at field if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industries' AND column_name = 'updated_at') THEN
    ALTER TABLE industries ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- The user_industries table already exists, so we just need to ensure it has the stage field
DO $$ 
BEGIN
  -- Add stage field to user_industries if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_industries' AND column_name = 'stage') THEN
    ALTER TABLE user_industries ADD COLUMN stage TEXT DEFAULT 'interested';
  END IF;
  
  -- Add created_at field if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_industries' AND column_name = 'created_at') THEN
    ALTER TABLE user_industries ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add updated_at field if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_industries' AND column_name = 'updated_at') THEN
    ALTER TABLE user_industries ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Insert standard industries that users can select from
INSERT INTO industries (name, category, is_popular) VALUES
  -- Technology
  ('Technology', 'Core Sectors', true),
  ('Software Development', 'Technology', true),
  ('Artificial Intelligence', 'Technology', true),
  ('Cybersecurity', 'Technology', true),
  ('Data Science', 'Technology', true),
  ('Cloud Computing', 'Technology', true),
  ('Mobile Development', 'Technology', false),
  ('Web Development', 'Technology', false),
  ('DevOps', 'Technology', false),
  
  -- Business & Finance
  ('Finance', 'Core Sectors', true),
  ('Banking', 'Finance', true),
  ('Investment', 'Finance', false),
  ('Insurance', 'Finance', false),
  ('Accounting', 'Finance', false),
  ('Consulting', 'Business', true),
  ('Management', 'Business', true),
  ('Strategy', 'Business', false),
  ('Operations', 'Business', false),
  
  -- Healthcare & Life Sciences
  ('Healthcare', 'Core Sectors', true),
  ('Medicine', 'Healthcare', true),
  ('Nursing', 'Healthcare', false),
  ('Pharmaceuticals', 'Healthcare', false),
  ('Biotechnology', 'Healthcare', false),
  ('Medical Devices', 'Healthcare', false),
  
  -- Creative & Media
  ('Marketing', 'Creative', true),
  ('Advertising', 'Creative', false),
  ('Design', 'Creative', true),
  ('Media', 'Creative', false),
  ('Entertainment', 'Creative', false),
  ('Content Creation', 'Creative', false),
  
  -- Education & Research
  ('Education', 'Core Sectors', true),
  ('Research', 'Education', false),
  ('Academia', 'Education', false),
  ('Training', 'Education', false),
  
  -- Other Key Sectors
  ('Manufacturing', 'Core Sectors', false),
  ('Retail', 'Core Sectors', false),
  ('Real Estate', 'Core Sectors', false),
  ('Transportation', 'Core Sectors', false),
  ('Energy', 'Core Sectors', false),
  ('Legal', 'Core Sectors', false),
  ('Non-Profit', 'Core Sectors', false),
  ('Government', 'Core Sectors', false)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance (only create if they don't exist)
CREATE INDEX IF NOT EXISTS idx_industries_category ON industries(category);
CREATE INDEX IF NOT EXISTS idx_industries_popular ON industries(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_user_industries_user_id ON user_industries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_industries_industry_id ON user_industries(industry_id);

-- RLS may already be enabled, so we'll do this conditionally
DO $$
BEGIN
  -- Enable RLS on industries if not already enabled
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'industries' AND relrowsecurity = true) THEN
    ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Enable RLS on user_industries if not already enabled
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_industries' AND relrowsecurity = true) THEN
    ALTER TABLE user_industries ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS Policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industries' AND policyname = 'Allow read access to industries') THEN
    CREATE POLICY "Allow read access to industries" ON industries FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_industries' AND policyname = 'Users can view their own industry selections') THEN
    CREATE POLICY "Users can view their own industry selections" ON user_industries FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_industries' AND policyname = 'Users can manage their own industry selections') THEN
    CREATE POLICY "Users can manage their own industry selections" ON user_industries FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Grant permissions
GRANT SELECT ON industries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_industries TO authenticated;

-- Function to get industries with user selection status
CREATE OR REPLACE FUNCTION get_industries_for_user(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  is_selected BOOLEAN,
  user_stage TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.category,
    (ui.user_id IS NOT NULL) as is_selected,
    ui.stage as user_stage
  FROM industries i
  LEFT JOIN user_industries ui ON i.id = ui.industry_id AND ui.user_id = user_id_param
  ORDER BY i.is_popular DESC, i.category, i.name;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_industries_for_user(UUID) TO authenticated;

COMMIT;