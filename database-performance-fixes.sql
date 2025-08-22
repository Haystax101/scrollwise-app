-- =====================================================
-- PERFORMANCE OPTIMIZATION FIXES
-- Phase 2: RLS Policy Optimization and Critical Indexes
-- =====================================================

-- Fix 3: Optimize RLS policies to use (SELECT auth.uid()) pattern
-- This prevents function re-evaluation for each row, providing 10-100x performance improvement

-- =====================================================
-- STEP 1: Update RLS Policies for Performance
-- =====================================================

-- profiles table RLS policies
DROP POLICY IF EXISTS "Allow insert on profiles table" ON public.profiles;
CREATE POLICY "Allow insert on profiles table" ON public.profiles
    FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Enable update for users based on the UserID" ON public.profiles;
CREATE POLICY "Enable update for users based on the UserID" ON public.profiles
    FOR UPDATE 
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- user_industries table
DROP POLICY IF EXISTS "Allow full access to own data" ON public.user_industries;
CREATE POLICY "Allow full access to own data" ON public.user_industries
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_education table
DROP POLICY IF EXISTS "Allow full access to own data" ON public.user_education;
CREATE POLICY "Allow full access to own data" ON public.user_education
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_goals table
DROP POLICY IF EXISTS "Allow full access to own data" ON public.user_goals;
CREATE POLICY "Allow full access to own data" ON public.user_goals
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- insights table
DROP POLICY IF EXISTS "insights_delete_author" ON public.insights;
CREATE POLICY "insights_delete_author" ON public.insights
    FOR DELETE 
    USING ((SELECT auth.uid()) = author_id);

-- user_experiences table
DROP POLICY IF EXISTS "Allow full access to own data" ON public.user_experiences;
CREATE POLICY "Allow full access to own data" ON public.user_experiences
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_goal_companies table
DROP POLICY IF EXISTS "Allow full access to own data" ON public.user_goal_companies;
CREATE POLICY "Allow full access to own data" ON public.user_goal_companies
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- article_likes table
DROP POLICY IF EXISTS "Allow full access to own likes" ON public.article_likes;
CREATE POLICY "Allow full access to own likes" ON public.article_likes
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- article_saves table
DROP POLICY IF EXISTS "Allow full access to own saves" ON public.article_saves;
CREATE POLICY "Allow full access to own saves" ON public.article_saves
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- article_views table
DROP POLICY IF EXISTS "Allow full access to own views" ON public.article_views;
CREATE POLICY "Allow full access to own views" ON public.article_views
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- comments table
DROP POLICY IF EXISTS "Allow full access to own comments" ON public.comments;
CREATE POLICY "Allow full access to own comments" ON public.comments
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- insight_likes table
DROP POLICY IF EXISTS "insight_likes_insert_own" ON public.insight_likes;
CREATE POLICY "insight_likes_insert_own" ON public.insight_likes
    FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- paper_likes table
DROP POLICY IF EXISTS "Users can view their own paper likes" ON public.paper_likes;
CREATE POLICY "Users can view their own paper likes" ON public.paper_likes
    FOR SELECT 
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own paper likes" ON public.paper_likes;
CREATE POLICY "Users can insert their own paper likes" ON public.paper_likes
    FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- book_likes table
DROP POLICY IF EXISTS "Allow full access to own likes" ON public.book_likes;
CREATE POLICY "Allow full access to own likes" ON public.book_likes
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- book_saves table
DROP POLICY IF EXISTS "Allow full access to own saves" ON public.book_saves;
CREATE POLICY "Allow full access to own saves" ON public.book_saves
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- paper_saves table
DROP POLICY IF EXISTS "Allow full access to own saves" ON public.paper_saves;
CREATE POLICY "Allow full access to own saves" ON public.paper_saves
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_achievements table
DROP POLICY IF EXISTS "Allow full access to own achievements" ON public.user_achievements;
CREATE POLICY "Allow full access to own achievements" ON public.user_achievements
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_skills table
DROP POLICY IF EXISTS "Allow full access to own skills" ON public.user_skills;
CREATE POLICY "Allow full access to own skills" ON public.user_skills
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- learning_sessions table
DROP POLICY IF EXISTS "Allow full access to own sessions" ON public.learning_sessions;
CREATE POLICY "Allow full access to own sessions" ON public.learning_sessions
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- content_views table
DROP POLICY IF EXISTS "Allow full access to own views" ON public.content_views;
CREATE POLICY "Allow full access to own views" ON public.content_views
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_content_interactions table
DROP POLICY IF EXISTS "Allow full access to own interactions" ON public.user_content_interactions;
CREATE POLICY "Allow full access to own interactions" ON public.user_content_interactions
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- =====================================================
-- STEP 2: Create Critical Indexes for Performance
-- =====================================================

-- Indexes for RLS policy optimization (user_id columns)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles (id);
CREATE INDEX IF NOT EXISTS idx_user_industries_user_id ON public.user_industries (user_id);
CREATE INDEX IF NOT EXISTS idx_user_education_user_id ON public.user_education (user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_user_experiences_user_id ON public.user_experiences (user_id);
CREATE INDEX IF NOT EXISTS idx_user_goal_companies_user_id ON public.user_goal_companies (user_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user_id ON public.article_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_article_saves_user_id ON public.article_saves (user_id);
CREATE INDEX IF NOT EXISTS idx_article_views_user_id ON public.article_views (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments (user_id);
CREATE INDEX IF NOT EXISTS idx_insight_likes_user_id ON public.insight_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_paper_likes_user_id ON public.paper_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_book_likes_user_id ON public.book_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_book_saves_user_id ON public.book_saves (user_id);
CREATE INDEX IF NOT EXISTS idx_paper_saves_user_id ON public.paper_saves (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills (user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON public.learning_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_content_views_user_id ON public.content_views (user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_interactions_user_id ON public.user_content_interactions (user_id);

-- Search optimization indexes
CREATE INDEX IF NOT EXISTS idx_articles_search_vector ON public.articles USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_papers_search_vector ON public.papers USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_books_search_vector ON public.books USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_companies_search_vector ON public.companies USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_occupations_search_vector ON public.occupations USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_skills_search_vector ON public.skills USING gin(search_vector);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_content_interactions_user_content 
    ON public.user_content_interactions (user_id, content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_date 
    ON public.learning_sessions (user_id, session_start_time DESC);

CREATE INDEX IF NOT EXISTS idx_content_views_user_type_date 
    ON public.content_views (user_id, content_type, viewed_at DESC);

-- Engagement metrics indexes
CREATE INDEX IF NOT EXISTS idx_article_likes_article_created 
    ON public.article_likes (article_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_article_created 
    ON public.comments (article_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_book_comments_book_created 
    ON public.book_comments (book_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_paper_comments_paper_created 
    ON public.paper_comments (paper_id, created_at DESC);

-- Analytics optimization indexes
CREATE INDEX IF NOT EXISTS idx_user_daily_activities_user_date 
    ON public.user_daily_activities (user_id, activity_date DESC);

-- Foreign key optimization indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_articles_industry_id ON public.articles (industry_id);
CREATE INDEX IF NOT EXISTS idx_papers_industry_id ON public.papers (industry_id);
CREATE INDEX IF NOT EXISTS idx_books_industry_id ON public.books (industry_id);

-- Timeline/chronological query optimization
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_papers_created_at ON public.papers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON public.insights (created_at DESC);

-- =====================================================
-- STEP 3: Performance Verification Queries
-- =====================================================

-- Check that RLS policies are using the optimized pattern
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    qual, 
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
    AND (qual NOT LIKE '%(SELECT auth.uid())%' OR with_check NOT LIKE '%(SELECT auth.uid())%');

-- Check index usage on user_id columns
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
    AND attname = 'user_id'
ORDER BY tablename;

-- Analyze tables to update statistics after index creation
ANALYZE public.profiles;
ANALYZE public.user_industries;
ANALYZE public.user_education;
ANALYZE public.user_goals;
ANALYZE public.article_likes;
ANALYZE public.article_saves;
ANALYZE public.comments;
ANALYZE public.learning_sessions;
ANALYZE public.content_views;

COMMIT;