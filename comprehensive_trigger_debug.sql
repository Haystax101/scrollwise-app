-- More comprehensive trigger debugging for insights table
-- The previous query might have missed some triggers

BEGIN;

-- 1. Check ALL triggers on insights table (including system/internal ones)
SELECT 
  t.tgname AS trigger_name,
  t.tgtype AS trigger_type,
  p.proname AS function_name,
  t.tgenabled AS enabled,
  t.tgisinternal AS is_internal,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
LEFT JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'insights'
ORDER BY t.tgisinternal, t.tgname;

-- 2. Check for any constraint triggers
SELECT 
  t.tgname AS trigger_name,
  'CONSTRAINT' AS trigger_type,
  c.relname AS table_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'insights' 
  AND t.tgtype & 64 = 64; -- constraint trigger

-- 3. Look for triggers via information_schema
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'insights'
  AND event_object_schema = 'public';

-- 4. Check for any rules on the insights table (these can also cause similar issues)
SELECT 
  r.rulename,
  r.ev_type,
  pg_get_ruledef(r.oid) AS rule_definition
FROM pg_rewrite r
JOIN pg_class c ON r.ev_class = c.oid
WHERE c.relname = 'insights'
  AND r.rulename != '_RETURN';

-- 5. Test the exact insert that's failing with more detailed error handling
DO $$
DECLARE
  test_user_id uuid := 'd80fa387-bcbc-47f3-b5ee-bd6ece5be66e'; -- Use the same user ID from the logs
  result_id uuid;
  text_var1 text;
  text_var2 text;
  text_var3 text;
  text_var4 text;
BEGIN
  RAISE NOTICE 'Testing insight insertion...';
  
  INSERT INTO insights (content, author_id) 
  VALUES ('Test insight for debugging', test_user_id)
  RETURNING id INTO result_id;
  
  RAISE NOTICE 'SUCCESS: Inserted insight with ID: %', result_id;
  
  -- Clean up the test record
  DELETE FROM insights WHERE id = result_id;
  RAISE NOTICE 'Cleaned up test record';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR during insert: SQLSTATE=% SQLERRM=%', SQLSTATE, SQLERRM;
    RAISE NOTICE 'Error detail: %', SQLERRM;
    
    -- Try to get more context about what triggered this
    GET STACKED DIAGNOSTICS 
      text_var1 = MESSAGE_TEXT,
      text_var2 = PG_EXCEPTION_DETAIL,
      text_var3 = PG_EXCEPTION_HINT,
      text_var4 = PG_EXCEPTION_CONTEXT;
    
    RAISE NOTICE 'Message: %', text_var1;
    RAISE NOTICE 'Detail: %', text_var2;
    RAISE NOTICE 'Hint: %', text_var3;
    RAISE NOTICE 'Context: %', text_var4;
END $$;