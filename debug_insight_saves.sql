-- Debug insight saves issue
-- Check if saves are being inserted but not showing up

-- 1. Check if any insight_saves records exist
SELECT COUNT(*) as total_insight_saves FROM public.insight_saves;

-- 2. Check recent insight_saves
SELECT 
    user_id,
    insight_id,
    created_at
FROM public.insight_saves 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if saves_count is being updated in insights table
SELECT 
    id,
    saves_count,
    content[1:50] as content_preview
FROM public.insights 
WHERE saves_count > 0
ORDER BY saves_count DESC;

-- 4. Check if the save trigger is working
SELECT 
    t.tgname AS trigger_name,
    c.relname AS table_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
    AND c.relname = 'insight_saves'
    AND t.tgname LIKE '%save%';

-- 5. Check RLS policies on insight_saves
SELECT * FROM pg_policies WHERE tablename = 'insight_saves';