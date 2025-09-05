-- SQL queries to find level calculation functions in Supabase

-- 1. Find all functions that might be related to voltz/level calculations
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND (
    p.proname ILIKE '%voltz%' 
    OR p.proname ILIKE '%level%' 
    OR p.prosrc ILIKE '%voltz%'
    OR p.prosrc ILIKE '%level%'
)
ORDER BY p.proname;

-- 2. Specifically look for the get_user_voltz_stats function
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_user_voltz_stats';

-- 3. Find any functions that calculate levels (broader search)
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.prosrc ILIKE '%100%' -- Looking for level thresholds
AND (p.prosrc ILIKE '%level%' OR p.prosrc ILIKE '%voltz%');

-- 4. Check if there are any views related to user stats
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
AND (
    viewname ILIKE '%voltz%' 
    OR viewname ILIKE '%level%' 
    OR viewname ILIKE '%stats%'
);