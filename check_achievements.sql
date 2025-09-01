-- Check achievements table criteria and current achievement system

-- 1. Check all achievements and their criteria
SELECT 
  name, 
  category, 
  criteria, 
  voltz_reward,
  is_active
FROM achievements 
WHERE is_active = true
ORDER BY category, name;

-- 2. Check current triggers on tables related to likes
-- Article likes
SELECT 
  'article_likes' as table_name,
  t.tgname AS trigger_name,
  p.proname AS function_name,
  t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'article_likes'
  AND t.tgname NOT LIKE 'RI_%';

-- Insight likes  
SELECT 
  'insight_likes' as table_name,
  t.tgname AS trigger_name,
  p.proname AS function_name,
  t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'insight_likes'
  AND t.tgname NOT LIKE 'RI_%';

-- 3. Check if we have any user achievements that should have been awarded
SELECT 
  user_id,
  achievement_type,
  title,
  earned_at
FROM user_achievements 
WHERE achievement_type ILIKE '%like%' 
   OR title ILIKE '%like%'
ORDER BY earned_at DESC
LIMIT 10;