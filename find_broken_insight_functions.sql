-- Find functions that incorrectly reference article_id when dealing with insights
-- These functions likely were copied from article functions and not properly updated

-- First, find functions that mention 'article_id' in their source code
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%insight%'
  AND pg_get_functiondef(p.oid) LIKE '%article_id%'
ORDER BY p.proname;