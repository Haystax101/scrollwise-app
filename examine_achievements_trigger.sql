-- Examine the trigger_check_achievements function that's causing the error

-- 1. Get the full definition of the trigger_check_achievements function
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'trigger_check_achievements';

-- 2. Check what triggers use this function
SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  t.tgenabled AS enabled,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname = 'trigger_check_achievements';

-- 3. Test what happens when we try to create an insight
-- This should reproduce the exact error
DO $$
DECLARE
  test_user_id uuid := 'd80fa387-bcbc-47f3-b5ee-bd6ece5be66e';
  result_id uuid;
BEGIN
  RAISE NOTICE 'Testing insight insertion to trigger achievements check...';
  
  -- This should trigger the achievements function and cause the user_id error
  INSERT INTO insights (content, author_id) 
  VALUES ('Test insight to reproduce error', test_user_id)
  RETURNING id INTO result_id;
  
  RAISE NOTICE 'SUCCESS: Inserted insight with ID: %', result_id;
  DELETE FROM insights WHERE id = result_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: SQLSTATE=% SQLERRM=%', SQLSTATE, SQLERRM;
END $$;