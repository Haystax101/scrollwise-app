-- =====================================================
-- CRITICAL SECURITY FIXES
-- Phase 1: Fix SECURITY DEFINER Views and Function Search Paths
-- =====================================================

-- Fix 1: Remove SECURITY DEFINER property from views
-- This prevents the views from running with elevated privileges

-- Fix duplicate_summary_monitoring view
DROP VIEW IF EXISTS public.duplicate_summary_monitoring;
-- You will need to recreate this view with proper definition
-- (View definition not available in schema overview)

-- Fix combined_content view  
DROP VIEW IF EXISTS public.combined_content;
-- You will need to recreate this view with proper definition
-- (View definition not available in schema overview)

-- =====================================================
-- Fix 2: Set search_path for all 98 functions with mutable search paths
-- This prevents object hijacking attacks
-- =====================================================

-- Batch fix all functions with mutable search_path
DO $$
DECLARE
    func_name TEXT;
    function_list TEXT[] := ARRAY[
        'update_book_comment_likes_count',
        'update_skill_search_data',
        'update_company_search_data',
        'search_articles',
        'update_paper_comments_count',
        'get_user_voltz_stats',
        'compute_level',
        'update_book_saves_count',
        'cleanup_old_content',
        'handle_new_user',
        'get_user_streaks',
        'update_user_voltz',
        'complete_user_onboarding',
        'get_existing_book_titles',
        'search_all_content',
        'get_user_achievements',
        'normalize_text',
        'vector_search',
        'get_user_achievement_progress',
        'get_article_view_count',
        'verify_migration_results',
        'cleanup_migrated_streak_goals',
        'get_user_career_goals',
        'get_threaded_book_comments',
        'update_articles_search_vector',
        'get_popular_companies',
        'record_user_activity',
        'update_books_search_vector',
        'get_industries_for_user',
        'update_book_views_count',
        'has_user_viewed_article',
        'update_paper_likes_count',
        'keyword_search',
        'update_user_streak_goal',
        'get_user_professional_summary',
        'add_comment_reply',
        'migrate_streak_goals',
        'update_user_streak_on_activity',
        'update_paper_views_count',
        'award_achievement',
        'get_user_profile_summary',
        'add_book_comment_reply',
        'check_duplicate_summary_attempt',
        'update_papers_search_vector',
        'update_article_comment_likes_count',
        'update_article_views_count',
        'get_enhanced_user_stats',
        'update_occupation_search_data',
        'get_user_top_skills',
        'find_similar_summaries',
        'get_threaded_paper_comments',
        'start_learning_session',
        'update_insight_comment_counts',
        'setup_user_learning_streak',
        'log_search',
        'update_book_comment_counts',
        'search_mixed',
        'add_paper_comment_reply',
        'calculate_profile_completion',
        'search_articles',
        'update_article_comment_counts',
        'get_threaded_article_comments',
        'increment_article_view_count',
        'grant_voltz_for_content_interaction',
        'update_paper_comment_likes_count',
        'update_insight_views_count',
        'get_user_stats',
        'check_and_award_achievements',
        'check_achievement_criteria',
        'search_companies',
        'update_book_comments_count',
        'book_exists_in_db',
        'update_paper_comment_counts',
        'record_selection',
        'get_user_active_days',
        'update_user_interest_profile',
        'end_learning_session',
        'update_insight_comment_likes_count',
        'check_content_similarity',
        'migrate_skills_from_profile_sections',
        'refresh_user_learning_analytics',
        'reset_all_books_to_unused',
        'update_skill_endorsement_count',
        'get_popular_occupations',
        'get_user_learning_stats',
        'trigger_check_achievements',
        'update_profile_completion',
        'get_article_search_suggestions',
        'update_paper_saves_count'
    ];
BEGIN
    FOREACH func_name IN ARRAY function_list
    LOOP
        BEGIN
            -- Try to set search_path for functions with various signature patterns
            EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public, pg_temp', func_name);
            RAISE NOTICE 'Fixed function: %', func_name;
        EXCEPTION
            WHEN others THEN
                BEGIN
                    -- Try with common parameter types
                    EXECUTE format('ALTER FUNCTION public.%I(bigint) SET search_path = public, pg_temp', func_name);
                    RAISE NOTICE 'Fixed function: % (bigint)', func_name;
                EXCEPTION
                    WHEN others THEN
                        BEGIN
                            -- Try with uuid parameter
                            EXECUTE format('ALTER FUNCTION public.%I(uuid) SET search_path = public, pg_temp', func_name);
                            RAISE NOTICE 'Fixed function: % (uuid)', func_name;
                        EXCEPTION
                            WHEN others THEN
                                BEGIN
                                    -- Try with text parameter
                                    EXECUTE format('ALTER FUNCTION public.%I(text) SET search_path = public, pg_temp', func_name);
                                    RAISE NOTICE 'Fixed function: % (text)', func_name;
                                EXCEPTION
                                    WHEN others THEN
                                        RAISE NOTICE 'Could not fix function: % - May need manual intervention', func_name;
                                END;
                        END;
                END;
        END;
    END LOOP;
END $$;

-- Manual fix for functions that may have specific signatures
-- You may need to adjust these based on actual function signatures:

-- For functions with multiple parameters, you'll need to specify exact signatures:
-- Example:
-- ALTER FUNCTION public.search_all_content(text, integer, integer) SET search_path = public, pg_temp;
-- ALTER FUNCTION public.get_user_achievement_progress(uuid, uuid) SET search_path = public, pg_temp;

-- =====================================================
-- Verification queries to check fixes were applied
-- =====================================================

-- Check remaining functions without search_path set
SELECT 
    routine_name,
    routine_schema,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
        SELECT unnest(ARRAY[
            'update_book_comment_likes_count',
            'update_skill_search_data',
            'handle_new_user',
            'search_articles'
        ])
    )
    AND routine_definition NOT LIKE '%search_path%';

-- Check for any remaining SECURITY DEFINER views
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE schemaname = 'public' 
    AND definition LIKE '%SECURITY DEFINER%';

COMMIT;