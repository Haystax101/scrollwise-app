-- COMPREHENSIVE DIAGNOSIS - Find ALL sources that might reference user_id on insights

-- 1. Check ALL triggers on insights (including disabled ones)
SELECT 
  'TRIGGER' as type,
  t.tgname AS name,
  p.proname AS function_name,
  t.tgenabled AS enabled,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'insights'
ORDER BY t.tgname;

-- 2. Check ALL functions that mention user_id (these could be called by triggers or app)
SELECT 
  'FUNCTION' as type,
  p.proname AS name,
  p.proname AS function_name,
  'N/A' as enabled,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
WHERE pg_get_functiondef(p.oid) ILIKE '%user_id%'
  AND (p.proname ILIKE '%achievement%' 
       OR p.proname ILIKE '%insight%' 
       OR p.proname ILIKE '%profile%'
       OR p.proname ILIKE '%award%');

-- 3. Check RLS policies on insights table (these could reference user_id)
SELECT 
  'RLS_POLICY' as type,
  policyname AS name,
  policyname AS function_name,
  'N/A' as enabled,
  'See pg_policies view for details' AS definition
FROM pg_policy
WHERE polrelid = 'public.insights'::regclass;

-- 4. Check if there are any views or materialized views based on insights
SELECT 
  'VIEW' as type,
  schemaname || '.' || viewname AS name,
  'N/A' AS function_name,
  'N/A' as enabled,
  definition
FROM pg_views 
WHERE definition ILIKE '%insights%' AND definition ILIKE '%user_id%';