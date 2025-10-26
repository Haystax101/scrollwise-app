-- Fix Profile Completion Calculation
-- This updates the calculate_profile_completion function to properly account for
-- the actual fields users fill out during onboarding:
-- - tagline (in profiles table)
-- - career goal (in user_goals table)
-- - passionate_about and working_on (in profile_passions table)

-- Drop the old function first
DROP FUNCTION IF EXISTS calculate_profile_completion(uuid);

-- Create updated function with correct field checks
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  completion_score integer := 0;
  total_possible integer := 100;
BEGIN
  -- Base profile info (30 points total)
  SELECT
    CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 10 ELSE 0 END +
    CASE WHEN tagline IS NOT NULL AND tagline != '' THEN 10 ELSE 0 END +
    CASE WHEN avatar_url IS NOT NULL THEN 10 ELSE 0 END
  INTO completion_score
  FROM profiles WHERE id = user_uuid;

  -- Career goal (20 points)
  IF EXISTS (SELECT 1 FROM user_goals WHERE user_id = user_uuid AND goal IS NOT NULL AND goal != '') THEN
    completion_score := completion_score + 20;
  END IF;

  -- Passions: passionate_about and working_on (25 points each = 50 points total)
  IF EXISTS (SELECT 1 FROM profile_passions WHERE user_id = user_uuid AND passionate_about IS NOT NULL AND passionate_about != '') THEN
    completion_score := completion_score + 25;
  END IF;

  IF EXISTS (SELECT 1 FROM profile_passions WHERE user_id = user_uuid AND working_on IS NOT NULL AND working_on != '') THEN
    completion_score := completion_score + 25;
  END IF;

  RETURN LEAST(completion_score, 100); -- Cap at 100%
END;
$$ LANGUAGE plpgsql;

-- Update trigger function to handle profile_passions table
DROP TRIGGER IF EXISTS trigger_update_profile_completion_passions ON public.profile_passions;
CREATE TRIGGER trigger_update_profile_completion_passions
  AFTER INSERT OR UPDATE OR DELETE ON public.profile_passions
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

-- Create trigger to award "Profile Perfectionist" achievement when profile reaches 100%
CREATE OR REPLACE FUNCTION check_profile_perfectionist()
RETURNS TRIGGER AS $$
DECLARE
  perfectionist_achievement_id uuid;
BEGIN
  -- Only trigger if profile completion reached 100%
  IF NEW.profile_completion_percentage = 100 AND (OLD.profile_completion_percentage IS NULL OR OLD.profile_completion_percentage < 100) THEN
    -- Get Profile Perfectionist achievement ID
    SELECT id INTO perfectionist_achievement_id
    FROM achievements
    WHERE criteria->>'action' = 'profile_completion'
    AND (criteria->>'percentage')::integer = 100
    AND is_active = true
    LIMIT 1;

    -- Award achievement if it exists and user doesn't have it yet
    IF perfectionist_achievement_id IS NOT NULL THEN
      INSERT INTO user_achievements (
        user_id, achievement_id, achievement_type, title, description, icon_name, earned_at
      )
      SELECT
        NEW.id, a.id, a.category, a.name, a.description, a.icon_name, NOW()
      FROM achievements a
      WHERE a.id = perfectionist_achievement_id
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements ua
        WHERE ua.user_id = NEW.id AND ua.achievement_id = perfectionist_achievement_id
      );

      -- Award voltz
      UPDATE profiles
      SET spendable_voltz = spendable_voltz + (SELECT voltz_reward FROM achievements WHERE id = perfectionist_achievement_id),
          total_voltz_earned = total_voltz_earned + (SELECT voltz_reward FROM achievements WHERE id = perfectionist_achievement_id)
      WHERE id = NEW.id;

      -- Log voltz transaction
      INSERT INTO xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
      SELECT
        NEW.id, a.voltz_reward, 'Achievement: Profile Perfectionist', 'achievement', a.id::text, 'earned'
      FROM achievements a
      WHERE a.id = perfectionist_achievement_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles table to check for Profile Perfectionist
DROP TRIGGER IF EXISTS trigger_check_profile_perfectionist ON public.profiles;
CREATE TRIGGER trigger_check_profile_perfectionist
  AFTER UPDATE OF profile_completion_percentage ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION check_profile_perfectionist();

-- Recalculate profile completion for all users to reflect new calculation
UPDATE profiles
SET profile_completion_percentage = calculate_profile_completion(id);

-- Verify the fix
SELECT
  p.id,
  p.full_name,
  p.tagline,
  p.avatar_url,
  ug.goal as career_goal,
  pp.passionate_about,
  pp.working_on,
  p.profile_completion_percentage as current_completion,
  calculate_profile_completion(p.id) as recalculated_completion
FROM profiles p
LEFT JOIN user_goals ug ON ug.user_id = p.id
LEFT JOIN profile_passions pp ON pp.user_id = p.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC
LIMIT 10;
