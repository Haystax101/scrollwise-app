-- Simple debug to see what's actually in your achievements table
SELECT 
    name,
    criteria,
    criteria->>'action' as action,
    is_active
FROM public.achievements 
ORDER BY name;

-- Also check what's in user_content_interactions for you
SELECT 
    content_type,
    interaction_types,
    COUNT(*) as count
FROM public.user_content_interactions 
WHERE user_id = 'your-user-id-here'  -- Replace with your actual user ID
GROUP BY content_type, interaction_types;

-- Check your profile data
SELECT 
    id,
    full_name,
    profile_completion_percentage,
    spendable_voltz,
    total_voltz_earned
FROM public.profiles 
WHERE id = 'your-user-id-here';  -- Replace with your actual user ID