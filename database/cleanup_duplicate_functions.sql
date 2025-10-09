-- Cleanup script to remove duplicate streak functions
-- Run this before testing to ensure only one version of each function exists

-- First, drop all triggers to avoid dependency issues
DO $$
BEGIN
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

    RAISE NOTICE 'All triggers dropped successfully';
END $$;

-- Drop all streak-related functions (handles duplicates)
DROP FUNCTION IF EXISTS update_user_streak(UUID, DATE);
DROP FUNCTION IF EXISTS log_daily_activity(UUID, TEXT[], DATE);
DROP FUNCTION IF EXISTS get_user_streak_info(UUID);
DROP FUNCTION IF EXISTS setup_user_learning_streak(UUID, INTEGER);
DROP FUNCTION IF EXISTS setup_user_learning_streak(UUID);  -- In case there's a version without integer param
DROP FUNCTION IF EXISTS trigger_update_streak_on_session();

-- Check what functions remain
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc
    WHERE proname IN ('update_user_streak', 'log_daily_activity', 'get_user_streak_info', 'setup_user_learning_streak', 'trigger_update_streak_on_session');

    RAISE NOTICE 'Remaining streak functions: % (should be 0)', func_count;

    IF func_count = 0 THEN
        RAISE NOTICE '✅ All duplicate functions cleaned up successfully';
    ELSE
        RAISE WARNING '⚠️ Some functions still exist. May need manual cleanup.';

        -- List remaining functions
        FOR func_count IN
            SELECT oid
            FROM pg_proc
            WHERE proname IN ('update_user_streak', 'log_daily_activity', 'get_user_streak_info', 'setup_user_learning_streak', 'trigger_update_streak_on_session')
        LOOP
            RAISE NOTICE 'Remaining function OID: %', func_count;
        END LOOP;
    END IF;
END $$;

RAISE NOTICE '';
RAISE NOTICE '🧹 Cleanup complete! Now run streak_functions.sql to recreate clean functions.';