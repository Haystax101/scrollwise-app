-- SIMPLE DIAGNOSIS - Find what's causing the user_id error

-- 1. List all functions that contain 'user_id' and might be related
SELECT 
  proname AS function_name
FROM pg_proc 
WHERE pg_get_functiondef(oid) ILIKE '%user_id%'
  AND (proname ILIKE '%achievement%' 
       OR proname ILIKE '%insight%' 
       OR proname ILIKE '%profile%'
       OR proname ILIKE '%award%')
ORDER BY proname;

-- 2. Check what specific function definitions contain user_id
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc 
WHERE proname IN ('award_achievements_simple', 'trigger_check_achievements', 'update_profile_completion');

-- 3. List all triggers on insights regardless of status
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'insights';

-- 4. Check if RLS is enabled on insights
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE tablename = 'insights';

-- 5. Simple check for policies
SELECT policyname FROM pg_policy WHERE polrelid = 'public.insights'::regclass;