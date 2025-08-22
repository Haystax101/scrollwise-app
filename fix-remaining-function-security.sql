-- =====================================================
-- FIX REMAINING FUNCTION SEARCH PATH SECURITY ISSUES
-- =====================================================

-- Fix remaining functions that weren't caught by the first batch script
-- These functions likely have different parameter signatures

DO $$
DECLARE
    func_record RECORD;
    remaining_functions TEXT[] := ARRAY[
        'search_articles',
        'update_user_voltz',
        'complete_user_onboarding',
        'search_all_content',
        'get_user_achievements',
        'vector_search',
        'get_article_view_count',
        'get_threaded_book_comments',
        'get_popular_companies',
        'record_user_activity',
        'has_user_viewed_article',
        'keyword_search',
        'update_user_streak_goal',
        'add_comment_reply',
        'award_achievement',
        'add_book_comment_reply',
        'get_user_top_skills',
        'find_similar_summaries',
        'get_threaded_paper_comments',
        'start_learning_session',
        'setup_user_learning_streak',
        'log_search',
        'search_mixed',
        'add_paper_comment_reply',
        'get_threaded_article_comments',
        'increment_article_view_count',
        'grant_voltz_for_content_interaction',
        'check_achievement_criteria',
        'search_companies',
        'book_exists_in_db',
        'record_selection',
        'end_learning_session',
        'check_content_similarity',
        'get_popular_occupations',
        'get_article_search_suggestions',
        'update_book_likes_count',
        'determine_streak_type',
        'extract_days_from_goal_text',
        'get_book_usage_stats',
        'record_daily_activity',
        'grant_xp_for_insight_interaction',
        'get_user_dashboard_data',
        'insert_insight_comment',
        'get_threaded_comments',
        'add_article_comment_reply',
        'search_occupations',
        'update_goal_progress'
    ];
    func_name TEXT;
BEGIN
    FOREACH func_name IN ARRAY remaining_functions
    LOOP
        -- Try to find the function with any signature and fix it
        FOR func_record IN 
            SELECT 
                p.proname as function_name,
                n.nspname as schema_name,
                pg_get_function_identity_arguments(p.oid) as args
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
                AND p.proname = func_name
        LOOP
            BEGIN
                EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
                    func_record.schema_name, 
                    func_record.function_name,
                    func_record.args);
                RAISE NOTICE 'Fixed function: %s(%s)', func_record.function_name, func_record.args;
            EXCEPTION
                WHEN others THEN
                    RAISE NOTICE 'Could not fix function: %s(%s) - Error: %', 
                        func_record.function_name, func_record.args, SQLERRM;
            END;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- EXTENSION SECURITY (OPTIONAL)
-- Moving extensions to extensions schema (optional - low priority)
-- =====================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move extensions to extensions schema (OPTIONAL - uncomment if you want to fix)
/*
-- Note: This requires superuser privileges and may affect existing functionality
-- Test thoroughly before implementing

ALTER EXTENSION vector SET SCHEMA extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- Update search_path to include extensions schema
-- You may need to update your application's search_path configuration
*/

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check remaining functions with mutable search_path
SELECT 
    p.proname as function_name,
    n.nspname as schema_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.prosecdef = false  -- Not security definer functions
    AND NOT EXISTS (
        SELECT 1 
        FROM pg_proc pp 
        WHERE pp.oid = p.oid 
            AND pp.proconfig IS NOT NULL 
            AND 'search_path=public,pg_temp' = ANY(pp.proconfig)
    )
    AND p.proname IN (
        'search_articles', 'update_user_voltz', 'complete_user_onboarding',
        'search_all_content', 'get_user_achievements', 'vector_search'
        -- Add more function names here if needed
    );

-- This query should return no rows after successful fix

COMMIT;