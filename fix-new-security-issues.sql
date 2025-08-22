-- =====================================================
-- FIX NEW SECURITY ISSUES FROM SCHEMA OPTIMIZATION
-- =====================================================

-- Fix 1: Remove SECURITY DEFINER from compatibility views
-- Recreate views without SECURITY DEFINER property

DROP VIEW IF EXISTS public.business_books_catalogue_view;
CREATE VIEW public.business_books_catalogue_view WITH (security_invoker = true) AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'business';

DROP VIEW IF EXISTS public.education_books_catalogue_view;
CREATE VIEW public.education_books_catalogue_view WITH (security_invoker = true) AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'education';

DROP VIEW IF EXISTS public.finance_books_catalogue_view;
CREATE VIEW public.finance_books_catalogue_view WITH (security_invoker = true) AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'finance';

DROP VIEW IF EXISTS public.healthcare_books_catalogue_view;
CREATE VIEW public.healthcare_books_catalogue_view WITH (security_invoker = true) AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'healthcare';

DROP VIEW IF EXISTS public.personal_development_books_catalogue_view;
CREATE VIEW public.personal_development_books_catalogue_view WITH (security_invoker = true) AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'personal_development';

DROP VIEW IF EXISTS public.politics_books_catalogue_view;
CREATE VIEW public.politics_books_catalogue_view WITH (security_invoker = true) AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'politics';

DROP VIEW IF EXISTS public.science_books_catalogue_view;
CREATE VIEW public.science_books_catalogue_view WITH (security_invoker = true) AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'science';

DROP VIEW IF EXISTS public.startup_books_catalogue_view;
CREATE VIEW public.startup_books_catalogue_view WITH (security_invoker = true) AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'startup';

DROP VIEW IF EXISTS public.technology_books_catalogue_view;
CREATE VIEW public.technology_books_catalogue_view WITH (security_invoker = true) AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'technology';

-- Fix 2: Enable RLS on partitioned tables
ALTER TABLE public.learning_sessions_2025_08 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions_2025_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions_2025_10 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for partitioned tables (same as main learning_sessions table)
CREATE POLICY "Allow full access to own sessions" ON public.learning_sessions_2025_08
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Allow full access to own sessions" ON public.learning_sessions_2025_09
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Allow full access to own sessions" ON public.learning_sessions_2025_10
    FOR ALL 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Verification: Check that views are no longer SECURITY DEFINER
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname LIKE '%books_catalogue_view'
    AND definition LIKE '%SECURITY DEFINER%';
-- Should return no rows

-- Verification: Check that RLS is enabled on partitioned tables
SELECT 
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename LIKE 'learning_sessions_2025_%';
-- Should show rowsecurity = true for all

COMMIT;