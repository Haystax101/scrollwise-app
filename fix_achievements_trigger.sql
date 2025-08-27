-- Fix the trigger_check_achievements function to handle different user ID field names
-- This will resolve the "record 'new' has no field 'user_id'" error

BEGIN;

-- First, let's see the current function definition (for backup)
DO $$
DECLARE
  func_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO func_def
  FROM pg_proc p
  WHERE p.proname = 'trigger_check_achievements';
  
  RAISE NOTICE 'Current function definition: %', func_def;
END $$;

-- Create a new version of the trigger_check_achievements function that handles different table structures
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id uuid;
  achievement_type text;
  achievement_title text;
  achievement_description text;
BEGIN
  -- Determine the user ID based on the table and operation
  CASE 
    WHEN TG_TABLE_NAME = 'insights' THEN
      -- Insights table uses author_id
      target_user_id := NEW.author_id;
      achievement_type := 'first_insight';
      achievement_title := 'First Insight';
      achievement_description := 'Published your first insight';
      
    WHEN TG_TABLE_NAME = 'comments' THEN
      target_user_id := NEW.user_id;
      achievement_type := 'first_comment';
      achievement_title := 'First Comment';
      achievement_description := 'Posted your first comment';
      
    WHEN TG_TABLE_NAME = 'insight_comments' THEN
      target_user_id := NEW.user_id;
      achievement_type := 'insight_commenter';
      achievement_title := 'Insight Commenter';
      achievement_description := 'Commented on an insight';
      
    WHEN TG_TABLE_NAME IN ('article_saves', 'book_saves', 'paper_saves') THEN
      target_user_id := NEW.user_id;
      achievement_type := 'content_saver';
      achievement_title := 'Content Curator';
      achievement_description := 'Saved your first piece of content';
      
    WHEN TG_TABLE_NAME = 'content_views' THEN
      target_user_id := NEW.user_id;
      achievement_type := 'content_explorer';
      achievement_title := 'Content Explorer';
      achievement_description := 'Viewed multiple pieces of content';
      
    WHEN TG_TABLE_NAME = 'xp_ledger' THEN
      target_user_id := NEW.user_id;
      achievement_type := 'xp_earner';
      achievement_title := 'XP Earner';
      achievement_description := 'Earned your first XP';
      
    WHEN TG_TABLE_NAME = 'profiles' THEN
      target_user_id := NEW.id;
      achievement_type := 'level_up';
      achievement_title := 'Level ' || NEW.level;
      achievement_description := 'Reached level ' || NEW.level;
      
    WHEN TG_TABLE_NAME = 'user_streaks' THEN
      target_user_id := NEW.user_id;
      achievement_type := 'streak_master';
      achievement_title := 'Streak Master';
      achievement_description := 'Built a learning streak';
      
    ELSE
      -- For unknown tables, log and skip
      RAISE NOTICE 'Achievement trigger called on unsupported table: %', TG_TABLE_NAME;
      RETURN NEW;
  END CASE;
  
  -- Only proceed if we have a valid user ID and achievement info
  IF target_user_id IS NOT NULL AND achievement_type IS NOT NULL THEN
    -- Check if user already has this type of achievement (to avoid duplicates)
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = target_user_id 
      AND achievement_type = achievement_type
    ) THEN
      -- Award the achievement
      INSERT INTO user_achievements (user_id, achievement_type, title, description)
      VALUES (target_user_id, achievement_type, achievement_title, achievement_description);
      
      RAISE NOTICE 'Awarded achievement "%" to user %', achievement_title, target_user_id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log errors but don't fail the original operation
    RAISE NOTICE 'Error in achievements trigger: % %', SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Test the fix by trying to insert an insight
DO $$
DECLARE
  test_user_id uuid := 'd80fa387-bcbc-47f3-b5ee-bd6ece5be66e';
  result_id uuid;
BEGIN
  RAISE NOTICE 'Testing insight insertion with fixed achievements trigger...';
  
  INSERT INTO insights (content, author_id) 
  VALUES ('Test insight after trigger fix', test_user_id)
  RETURNING id INTO result_id;
  
  RAISE NOTICE 'SUCCESS: Inserted insight with ID: %', result_id;
  
  -- Clean up the test record
  DELETE FROM insights WHERE id = result_id;
  RAISE NOTICE 'Cleaned up test record';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: SQLSTATE=% SQLERRM=%', SQLSTATE, SQLERRM;
END $$;