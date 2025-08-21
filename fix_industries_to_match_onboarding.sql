-- Fix industries table to match the exact 9 industries from onboarding
-- Clear existing industries and insert the correct ones

BEGIN;

-- First, clear any existing industries that don't match our onboarding list
DELETE FROM industries WHERE name NOT IN (
  'Finance and Economics',
  'Politics, Law and International Relations', 
  'Entrepreneurship and Startups',
  'Technology and AI',
  'Energy, Sustainability and Climate Innovation',
  'Creative Industries and the Arts',
  'Engineering and Automotive',
  'Medicine and Healthcare',
  'Education'
);

-- Insert the exact 9 industries from onboarding (matching the hardcoded array)
INSERT INTO industries (name, category, is_popular) VALUES
  ('Finance and Economics', 'Core Sectors', true),
  ('Politics, Law and International Relations', 'Core Sectors', true),
  ('Entrepreneurship and Startups', 'Core Sectors', true),
  ('Technology and AI', 'Core Sectors', true),
  ('Energy, Sustainability and Climate Innovation', 'Core Sectors', true),
  ('Creative Industries and the Arts', 'Core Sectors', true),
  ('Engineering and Automotive', 'Core Sectors', true),
  ('Medicine and Healthcare', 'Core Sectors', true),
  ('Education', 'Core Sectors', true)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  is_popular = EXCLUDED.is_popular;

-- Update the get_industries_for_user function to work with our schema
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
  ORDER BY 
    CASE i.name
      WHEN 'Finance and Economics' THEN 1
      WHEN 'Politics, Law and International Relations' THEN 2
      WHEN 'Entrepreneurship and Startups' THEN 3
      WHEN 'Technology and AI' THEN 4
      WHEN 'Energy, Sustainability and Climate Innovation' THEN 5
      WHEN 'Creative Industries and the Arts' THEN 6
      WHEN 'Engineering and Automotive' THEN 7
      WHEN 'Medicine and Healthcare' THEN 8
      WHEN 'Education' THEN 9
      ELSE 10
    END;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Verify the correct industries are inserted
SELECT id, name, category, is_popular FROM industries ORDER BY name;