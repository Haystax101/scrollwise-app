-- Test Logging RPC
-- Run this in Supabase SQL Editor

-- REPLACE THIS WITH YOUR REAL USER ID (from auth.users or profiles)
-- The user ID "0000..." likely won't exist in your 'profiles' table foreign key, causing a constraint error.
-- Please copy your actual User UUID from the Supabase Authentication or Profiles table.

DO $$
DECLARE
    -- REPLACE WITH YOUR UUID HERE vvv
    v_test_user_id uuid := 'PLACE_YOUR_UUID_HERE'; 
BEGIN
    -- 1. Test RPC execution (Function Check)
    -- We pass the user ID explicitly since we are not logged in via the Editor
    PERFORM log_interaction(
        101, -- content_id
        'article', -- content_type
        15, -- duration
        100, -- completion
        NULL, -- time_of_day
        v_test_user_id -- Explicit User ID
    );
END $$;

-- 2. View Results
SELECT * FROM learning_sessions ORDER BY created_at DESC LIMIT 5;
