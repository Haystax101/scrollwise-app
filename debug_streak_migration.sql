-- Debug script to understand existing user_goals data
-- Run this to see what streak-like goals exist

BEGIN;

-- Show all goals to understand the data structure
SELECT 
  'All user goals:' as debug_info,
  user_id, 
  goal, 
  timeframe,
  created_at
FROM user_goals 
ORDER BY created_at DESC 
LIMIT 20;

-- Show goals that might be streak-related with different patterns
SELECT 
  'Potential streak goals:' as debug_info,
  user_id, 
  goal, 
  timeframe,
  created_at,
  CASE 
    WHEN goal ILIKE '%weekly learning goal%' THEN 'matches weekly learning goal'
    WHEN goal ILIKE '%day%streak%' THEN 'matches day streak'  
    WHEN goal ILIKE '%daily%learning%' THEN 'matches daily learning'
    WHEN goal ILIKE '%day%goal%' THEN 'matches day goal'
    WHEN timeframe = 'weekly' THEN 'matches weekly timeframe'
    WHEN goal ~ '\d+\s*days?' THEN 'matches number days pattern'
    ELSE 'no match'
  END as match_reason
FROM user_goals 
WHERE (
  goal ILIKE '%weekly learning goal%' OR
  goal ILIKE '%day%streak%' OR
  goal ILIKE '%daily%learning%' OR  
  goal ILIKE '%day%goal%' OR
  timeframe = 'weekly' OR
  goal ~ '\d+\s*days?'
)
ORDER BY created_at DESC;

-- Check if there are any goals at all
SELECT 
  'Goal count summary:' as debug_info,
  COUNT(*) as total_goals,
  COUNT(*) FILTER (WHERE timeframe = 'weekly') as weekly_timeframe_goals,
  COUNT(*) FILTER (WHERE goal ILIKE '%learning%') as learning_related_goals,
  COUNT(*) FILTER (WHERE goal ILIKE '%day%') as day_related_goals
FROM user_goals;

ROLLBACK; -- Don't actually change anything, just show data