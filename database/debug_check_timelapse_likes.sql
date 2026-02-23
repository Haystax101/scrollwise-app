-- Run this to see who is liking the 'magic' timelapses
-- If you see the same 4 users immediately after creation, 
-- check if 'process-timelapse' worker is adding them.

SELECT 
    t.id as timelapse_id,
    t.title,
    t.created_at as timelapse_created_at,
    t.likes_count,
    l.user_id as liker_id,
    l.created_at as liked_at,
    p.full_name as liker_name,
    p.email -- if available/visible
FROM public.timelapse_sessions t
JOIN public.timelapse_likes l ON t.id = l.timelapse_id
LEFT JOIN public.profiles p ON l.user_id = p.id
ORDER BY t.created_at DESC, l.created_at ASC
LIMIT 40;
