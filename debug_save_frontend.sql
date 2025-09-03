-- Debug saves from a frontend perspective
-- Test if we can manually perform the save operations that the frontend attempts

-- 1. Test manual save insertion (replace with real user_id and insight_id)
-- First, get a real insight ID and user ID to test with:
SELECT 
  i.id as insight_id,
  i.author_id,
  i.content[1:50] as content_preview
FROM insights i 
LIMIT 3;

-- Get current user (you'll need to replace this with your actual user ID)
-- INSERT INTO insight_saves (user_id, insight_id) 
-- VALUES ('YOUR_USER_ID_HERE', 'INSIGHT_ID_FROM_ABOVE')
-- ON CONFLICT (user_id, insight_id) DO NOTHING;

-- 2. Test if we can read from insight_saves as authenticated user
SELECT 'Testing basic read access to insight_saves table';
SELECT COUNT(*) FROM insight_saves;

-- 3. Test the exact query that the frontend uses for saved insights
-- This is the query from Insights.tsx that's failing
SELECT 
  s.insight_id,
  s.created_at,
  i.id,
  i.content[1:30] as content,
  i.likes_count,
  i.comments_count,
  i.views_count,
  i.author_id,
  p.full_name
FROM insight_saves s
JOIN insights i ON s.insight_id = i.id
LEFT JOIN profiles p ON i.author_id = p.id
WHERE s.user_id = 'YOUR_USER_ID_HERE'
ORDER BY s.created_at DESC;

-- 4. Test if insights are being fetched with saves_count
SELECT 
  id,
  content[1:30] as content_preview,
  likes_count,
  saves_count,
  comments_count,
  views_count
FROM insights 
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check RLS policies that might be blocking saves
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('insight_saves', 'insights')
ORDER BY tablename, cmd;