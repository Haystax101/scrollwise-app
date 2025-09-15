-- Set default theme preference to 'dark' for the theme_preference column
-- This will apply to all new users when their profile is created

-- First, update existing users who have NULL or 'system' theme preference to 'dark'
UPDATE profiles 
SET theme_preference = 'dark' 
WHERE theme_preference IS NULL OR theme_preference = 'system';

-- Set the default value for the theme_preference column to 'dark'
-- This ensures all new users automatically get 'dark' theme when their profile is created
ALTER TABLE profiles 
ALTER COLUMN theme_preference SET DEFAULT 'dark';

-- Optional: Add a check constraint to only allow 'light' or 'dark' values
-- This prevents invalid values like 'system' from being saved in the future
ALTER TABLE profiles 
ADD CONSTRAINT theme_preference_check 
CHECK (theme_preference IN ('light', 'dark'));