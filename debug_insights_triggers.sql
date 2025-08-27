-- Debug script to investigate the insights table triggers and schema
-- Run this to identify the root cause of the "user_id" field error

-- 1. Check all triggers on the insights table
SELECT 
  t.tgname AS trigger_name,
  t.tgtype AS trigger_type,
  p.proname AS function_name,
  t.tgenabled AS enabled,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'insights'
  AND t.tgisinternal = false;

-- 2. Check the insights table schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'insights' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. List all functions that reference user_id
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE pg_get_functiondef(p.oid) ILIKE '%user_id%'
  AND p.proname ILIKE '%profile%';

-- 4. Check for any triggers that use the update_profile_completion function
SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname = 'update_profile_completion';

-- 5. Test inserting a dummy insight to reproduce the error
-- (Comment this out if you don't want to test)
/*
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Get a test user ID
  SELECT id INTO test_user_id FROM profiles LIMIT 1;
  
  -- Try to insert a test insight
  INSERT INTO insights (content, author_id) 
  VALUES ('Test insight for debugging', test_user_id);
  
  -- If successful, clean up
  DELETE FROM insights WHERE content = 'Test insight for debugging';
  
  RAISE NOTICE 'Test insight insertion successful - no trigger issues detected';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting test insight: % %', SQLSTATE, SQLERRM;
END $$;
*/