-- Debug Achievement System
-- Run this to diagnose what's wrong

-- First, let's see what's actually in your interaction tables
-- Replace 'your-user-id' with your actual user ID

-- Check insight likes
SELECT 'insight_likes' as table_name, COUNT(*) as count 
FROM public.insight_likes 
WHERE user_id = 'your-user-id';

-- Check article likes  
SELECT 'article_likes' as table_name, COUNT(*) as count 
FROM public.article_likes 
WHERE user_id = 'your-user-id';

-- Check paper likes
SELECT 'paper_likes' as table_name, COUNT(*) as count 
FROM public.paper_likes 
WHERE user_id = 'your-user-id';

-- Check book likes
SELECT 'book_likes' as table_name, COUNT(*) as count 
FROM public.book_likes 
WHERE user_id = 'your-user-id';

-- Check insights published
SELECT 'insights_published' as table_name, COUNT(*) as count 
FROM public.insights 
WHERE author_id = 'your-user-id';

-- Check comments made
SELECT 'insight_comments' as table_name, COUNT(*) as count 
FROM public.insight_comments 
WHERE user_id = 'your-user-id';

SELECT 'article_comments' as table_name, COUNT(*) as count 
FROM public.comments 
WHERE user_id = 'your-user-id';

-- Check quiz attempts
SELECT 'quiz_attempts' as table_name, COUNT(*) as count 
FROM public.quiz_attempts 
WHERE user_id = 'your-user-id';

-- Check profile completion
SELECT 'profile_completion' as table_name, profile_completion_percentage as value 
FROM public.profiles 
WHERE id = 'your-user-id';

-- Check user_content_interactions (since you mentioned this table)
SELECT 'user_content_interactions' as table_name, 
       content_type, 
       interaction_types,
       COUNT(*) as count
FROM public.user_content_interactions 
WHERE user_id = 'your-user-id'
GROUP BY content_type, interaction_types;