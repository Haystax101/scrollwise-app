-- Detailed debug of insight saves functionality
-- Run this as an authenticated user to test saves

-- 1. Test if you can manually insert a save
-- Replace 'YOUR_USER_ID' and 'SOME_INSIGHT_ID' with actual values
-- INSERT INTO insight_saves (user_id, insight_id) 
-- VALUES ('YOUR_USER_ID', 'SOME_INSIGHT_ID')
-- ON CONFLICT (user_id, insight_id) DO NOTHING;

-- 2. Check if any insight_saves exist at all
SELECT COUNT(*) as total_saves FROM insight_saves;

-- 3. Check recent insight_saves with insight details
SELECT 
  s.user_id,
  s.insight_id,
  s.created_at,
  i.content[1:30] as insight_preview,
  i.saves_count,
  p.full_name as saver_name
FROM insight_saves s
JOIN insights i ON s.insight_id = i.id
LEFT JOIN profiles p ON s.user_id = p.id
ORDER BY s.created_at DESC 
LIMIT 10;

-- 4. Check which insights have saves_count > 0
SELECT 
  id,
  saves_count,
  content[1:50] as content_preview,
  author_id
FROM insights 
WHERE saves_count > 0
ORDER BY saves_count DESC;

-- 5. Check if the trigger for updating saves_count exists and is working
SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'insight_saves'
  AND t.tgname LIKE '%save%'
ORDER BY t.tgname;

-- 6. Test if the function exists
SELECT proname, prosrc 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%insight_save%';

-- 7. Check what happens when we manually update saves_count
-- UPDATE insights SET saves_count = (
--   SELECT COUNT(*) FROM insight_saves WHERE insight_id = insights.id
-- );

-- 8. Check for any error logs in triggers
-- Look for any failed trigger executions