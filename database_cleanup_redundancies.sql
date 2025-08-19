-- DATABASE CLEANUP: Remove Redundancies
-- This addresses duplicate and redundant tables identified in the schema analysis

-- =======================
-- 1. REMOVE DUPLICATE VIEW TABLES
-- =======================

-- We keep content_views as the unified view tracking system
-- and remove the specific view tables which are redundant

-- Check if these tables are empty before removing
-- If they contain data, we'd need to migrate it to content_views first

-- Remove duplicate article views table (keeping the enhanced one temporarily for data check)
-- DROP TABLE IF EXISTS public.article_views CASCADE; -- Uncomment after verifying no important data

-- Remove specific view tables since we use content_views for unified tracking
-- Note: Only uncomment these after ensuring no critical data is lost
-- DROP TABLE IF EXISTS public.article_views_enhanced CASCADE;
-- DROP TABLE IF EXISTS public.paper_views CASCADE;
-- DROP TABLE IF EXISTS public.book_views CASCADE;
-- DROP TABLE IF EXISTS public.insight_views CASCADE;

-- =======================
-- 2. DATA MIGRATION (if needed)
-- =======================

-- If the specific view tables contain data that's not in content_views,
-- we would need to migrate it. This would look like:

-- Example migration for article_views:
/*
INSERT INTO public.content_views (user_id, content_type, content_id, viewed_at, view_duration)
SELECT 
    user_id, 
    'article' as content_type, 
    article_id as content_id, 
    created_at as viewed_at,
    0 as view_duration
FROM public.article_views 
WHERE NOT EXISTS (
    SELECT 1 FROM public.content_views cv 
    WHERE cv.user_id = article_views.user_id 
    AND cv.content_type = 'article' 
    AND cv.content_id = article_views.article_id
);
*/

-- Similar patterns would apply for paper_views, book_views, insight_views

-- =======================
-- 3. CLEANUP CHECKLIST
-- =======================

-- Before running the DROP commands:
-- 1. Verify no application code references the specific view tables
-- 2. Check if tables contain data not present in content_views
-- 3. Migrate any important data to content_views
-- 4. Test that view tracking still works with content_views only
-- 5. Run the DROP commands

-- =======================
-- 4. SCHEMA STANDARDIZATION NOTES
-- =======================

-- The inconsistent ID types (integer vs bigint vs uuid) across content tables
-- would require a major refactoring to standardize. This should be done in phases:

-- Phase 1: Ensure all new content uses consistent UUID types
-- Phase 2: Create migration scripts for existing integer/bigint IDs
-- Phase 3: Update all foreign keys and application code
-- Phase 4: Complete the migration

-- This is a significant undertaking and should be planned carefully
-- to avoid breaking the application.

-- For now, we focus on removing clear redundancies while maintaining
-- the existing mixed ID system until a major refactor can be planned.