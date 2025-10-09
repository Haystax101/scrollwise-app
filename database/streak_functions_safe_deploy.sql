-- Safe Deployment Script for Streak Functions
-- This script handles PostgreSQL dependencies properly

-- Step 1: Drop all triggers first (to allow function updates)
DO $$
BEGIN
    -- Check if triggers exist before dropping to avoid errors
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'learning_session_streak_update') THEN
        DROP TRIGGER learning_session_streak_update ON learning_sessions;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'learning_session_streak_update_2025_08') THEN
        DROP TRIGGER learning_session_streak_update_2025_08 ON learning_sessions_2025_08;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'learning_session_streak_update_2025_09') THEN
        DROP TRIGGER learning_session_streak_update_2025_09 ON learning_sessions_2025_09;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'learning_session_streak_update_2025_10') THEN
        DROP TRIGGER learning_session_streak_update_2025_10 ON learning_sessions_2025_10;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'learning_session_streak_update_partitioned') THEN
        DROP TRIGGER learning_session_streak_update_partitioned ON learning_sessions_partitioned;
    END IF;

    RAISE NOTICE 'All existing streak triggers dropped successfully';
END $$;

-- Step 2: Drop and recreate functions (now safe)
\i database/streak_functions.sql

-- Step 3: Verify deployment
DO $$
DECLARE
    function_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN ('update_user_streak', 'log_daily_activity', 'get_user_streak_info', 'setup_user_learning_streak', 'trigger_update_streak_on_session');

    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname LIKE '%streak%';

    RAISE NOTICE 'Deployment verification:';
    RAISE NOTICE '- Functions created: % (expected: 5)', function_count;
    RAISE NOTICE '- Triggers created: % (expected: 5)', trigger_count;

    IF function_count = 5 AND trigger_count = 5 THEN
        RAISE NOTICE '✅ Streak system deployment successful!';
    ELSE
        RAISE WARNING '⚠️ Deployment may be incomplete. Please check manually.';
    END IF;
END $$;