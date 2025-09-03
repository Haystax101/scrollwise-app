-- Debug query to find triggers that might be incorrectly firing for insights
-- Look for triggers that reference article_id but might be firing on insight operations

SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  p.proname AS function_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
  AND t.tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
  AND (
    -- Look for triggers on tables that might affect insights
    c.relname IN ('insight_likes', 'insight_comments', 'insight_saves')
    OR 
    -- Look for functions that might reference article_id
    pg_get_functiondef(p.oid) LIKE '%article_id%'
  )
ORDER BY c.relname, t.tgname;