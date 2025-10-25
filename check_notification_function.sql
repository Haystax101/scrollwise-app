-- Check if create_notification_secure function exists and see its parameters

-- Step 1: Check if function exists
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as parameters,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_notification_secure'
  AND n.nspname = 'public';

-- Step 2: If no results above, the function is missing!
-- Check what notification-related functions DO exist:
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%notification%'
  AND n.nspname = 'public'
ORDER BY p.proname;