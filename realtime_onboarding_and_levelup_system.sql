-- Real-time Onboarding Progress & Level-Up Notification System
-- This SQL file sets up:
-- 1. Profile completion tracking with automatic achievement awarding
-- 2. Level-up notifications that go to the activity tab
-- 3. Real-time triggers for instant updates

-- ============================================================================
-- PART 1: Profile Completion System
-- ============================================================================

-- Drop old function and create updated version
DROP FUNCTION IF EXISTS calculate_profile_completion(uuid);

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

-- Trigger to award "Profile Perfectionist" achievement when profile reaches 100%
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

-- ============================================================================
-- PART 2: Level-Up Notification System
-- ============================================================================

-- Add 'level_up' notification type if it doesn't exist
DO $$
BEGIN
  -- Check if we need to update the notifications table type constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_type_check'
    AND conrelid = 'notifications'::regclass
    AND pg_get_constraintdef(oid) LIKE '%level_up%'
  ) THEN
    -- Drop old constraint
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

    -- Add new constraint with level_up
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type = ANY (ARRAY[
      'like'::text,
      'comment'::text,
      'friend_request'::text,
      'friend_accepted'::text,
      'save'::text,
      'share'::text,
      'streak_reminder'::text,
      'goal_achievement'::text,
      'friend_insight'::text,
      'milestone'::text,
      'reply'::text,
      'digest'::text,
      'level_up'::text
    ]));
  END IF;
END $$;

-- Function to create level-up notification
CREATE OR REPLACE FUNCTION create_level_up_notification()
RETURNS TRIGGER AS $$
DECLARE
  new_level integer;
  old_level integer;
BEGIN
  -- Get the new and old levels
  new_level := NEW.level;
  old_level := COALESCE(OLD.level, 1);

  -- Only create notification if user actually leveled up
  IF new_level > old_level THEN
    -- Create notification
    INSERT INTO notifications (
      user_id,
      source_user_id, -- self-notification
      type,
      message,
      is_read,
      created_at,
      action_url
    ) VALUES (
      NEW.id,
      NEW.id,
      'level_up',
      'Congratulations! You''ve reached Level ' || new_level || '! 🎉',
      false,
      NOW(),
      '/profile' -- Link to their profile
    );

    RAISE NOTICE 'Level-up notification created for user % (Level % → %)', NEW.id, old_level, new_level;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for level-up notifications
DROP TRIGGER IF EXISTS trigger_level_up_notification ON public.profiles;
CREATE TRIGGER trigger_level_up_notification
  AFTER UPDATE OF level ON public.profiles
  FOR EACH ROW
  WHEN (NEW.level > OLD.level)
  EXECUTE FUNCTION create_level_up_notification();

-- ============================================================================
-- PART 3: Real-time Enablement
-- ============================================================================

-- Enable real-time for profiles table (for profile_completion_percentage, level, spendable_voltz, total_voltz_earned)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Enable real-time for user_achievements table (for onboarding progress tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;

-- Enable real-time for profile_passions table (for profile completion tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE profile_passions;

-- Enable real-time for user_goals table (for profile completion tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE user_goals;

-- Enable real-time for notifications table (for level-up notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================================
-- PART 4: Recalculate Existing Data
-- ============================================================================

-- Recalculate profile completion for all users
UPDATE profiles
SET profile_completion_percentage = calculate_profile_completion(id);

-- ============================================================================
-- PART 5: Testing & Verification
-- ============================================================================

-- Verify profile completion calculation for recent users
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

-- Check if realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('profiles', 'user_achievements', 'profile_passions', 'user_goals', 'notifications');

-- Summary
SELECT
  '✅ Profile completion system updated' as status,
  'Tracks: tagline, avatar, career_goal, passionate_about, working_on' as fields_tracked,
  '90% = all fields filled, 100% = includes avatar' as completion_logic
UNION ALL
SELECT
  '✅ Level-up notifications enabled' as status,
  'Creates notification in activity tab when user levels up' as fields_tracked,
  'Triggers on profiles.level UPDATE' as completion_logic
UNION ALL
SELECT
  '✅ Real-time subscriptions enabled' as status,
  'Tables: profiles, user_achievements, profile_passions, user_goals, notifications' as fields_tracked,
  'Frontend can subscribe to changes instantly' as completion_logic;
