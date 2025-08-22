-- =====================================================
-- SCHEMA OPTIMIZATION
-- Phase 3: Consolidate redundant tables and optimize structure
-- =====================================================

-- =====================================================
-- STEP 1: Consolidate Book Catalog Tables
-- =====================================================

-- Create unified books_catalogue table
CREATE TABLE IF NOT EXISTS public.books_catalogue (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    author text NOT NULL,
    date integer,
    industry_type text NOT NULL CHECK (industry_type = ANY (ARRAY[
        'business'::text, 
        'education'::text, 
        'finance'::text, 
        'healthcare'::text, 
        'personal_development'::text, 
        'politics'::text, 
        'science'::text, 
        'startup'::text, 
        'technology'::text
    ])),
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT books_catalogue_pkey PRIMARY KEY (id),
    CONSTRAINT books_catalogue_unique_book UNIQUE (name, author, industry_type)
);

-- Enable RLS on the new table
ALTER TABLE public.books_catalogue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for books_catalogue (assuming read-only for authenticated users)
CREATE POLICY "Allow read access to books catalogue" ON public.books_catalogue
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Migrate data from existing catalog tables
INSERT INTO public.books_catalogue (name, author, date, industry_type, used, created_at)
SELECT name, author, date, 'business', used, created_at 
FROM public.business_books_catalogue
ON CONFLICT (name, author, industry_type) DO NOTHING;

INSERT INTO public.books_catalogue (name, author, date, industry_type, used, created_at)
SELECT name, author, date, 'education', used, created_at 
FROM public.education_books_catalogue
ON CONFLICT (name, author, industry_type) DO NOTHING;

INSERT INTO public.books_catalogue (name, author, date, industry_type, used, created_at)
SELECT name, author, date, 'finance', used, created_at 
FROM public.finance_books_catalogue
ON CONFLICT (name, author, industry_type) DO NOTHING;

INSERT INTO public.books_catalogue (name, author, date, industry_type, used, created_at)
SELECT name, author, date, 'healthcare', used, created_at 
FROM public.healthcare_books_catalogue
ON CONFLICT (name, author, industry_type) DO NOTHING;

INSERT INTO public.books_catalogue (name, author, date, industry_type, used, created_at)
SELECT name, author, date, 'personal_development', used, created_at 
FROM public.personal_development_books_catalogue
ON CONFLICT (name, author, industry_type) DO NOTHING;

INSERT INTO public.books_catalogue (name, author, date, industry_type, used, created_at)
SELECT name, author, date, 'politics', used, created_at 
FROM public.politics_books_catalogue
ON CONFLICT (name, author, industry_type) DO NOTHING;

INSERT INTO public.books_catalogue (name, author, date, industry_type, used, created_at)
SELECT name, author, date, 'science', used, created_at 
FROM public.science_books_catalogue
ON CONFLICT (name, author, industry_type) DO NOTHING;

INSERT INTO public.books_catalogue (name, author, date, industry_type, used, created_at)
SELECT name, author, date, 'startup', used, created_at 
FROM public.startup_books_catalogue
ON CONFLICT (name, author, industry_type) DO NOTHING;

INSERT INTO public.books_catalogue (name, author, date, industry_type, used, created_at)
SELECT name, author, date, 'technology', used, created_at 
FROM public.technology_books_catalogue
ON CONFLICT (name, author, industry_type) DO NOTHING;

-- Create indexes for the new consolidated table
CREATE INDEX IF NOT EXISTS idx_books_catalogue_industry_type ON public.books_catalogue (industry_type);
CREATE INDEX IF NOT EXISTS idx_books_catalogue_used ON public.books_catalogue (used);
CREATE INDEX IF NOT EXISTS idx_books_catalogue_name_author ON public.books_catalogue (name, author);

-- =====================================================
-- STEP 2: Remove Redundant article_views_enhanced Table
-- =====================================================

-- First, check if article_views_enhanced has any unique data not in article_views
-- If there are unique records, we need to preserve them

-- Migrate any unique data from article_views_enhanced to article_views
-- (This assumes article_views_enhanced has additional functionality we want to preserve)
INSERT INTO public.article_views (user_id, article_id, created_at)
SELECT ave.user_id, ave.article_id, ave.created_at
FROM public.article_views_enhanced ave
LEFT JOIN public.article_views av ON ave.user_id = av.user_id AND ave.article_id = av.article_id
WHERE av.id IS NULL
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: Create Views for Backward Compatibility
-- =====================================================

-- Create views to maintain backward compatibility for the old catalog tables
-- These views will allow existing code to continue working while using the new consolidated table

CREATE OR REPLACE VIEW public.business_books_catalogue_view AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'business';

CREATE OR REPLACE VIEW public.education_books_catalogue_view AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'education';

CREATE OR REPLACE VIEW public.finance_books_catalogue_view AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'finance';

CREATE OR REPLACE VIEW public.healthcare_books_catalogue_view AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'healthcare';

CREATE OR REPLACE VIEW public.personal_development_books_catalogue_view AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'personal_development';

CREATE OR REPLACE VIEW public.politics_books_catalogue_view AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'politics';

CREATE OR REPLACE VIEW public.science_books_catalogue_view AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'science';

CREATE OR REPLACE VIEW public.startup_books_catalogue_view AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'startup';

CREATE OR REPLACE VIEW public.technology_books_catalogue_view AS
SELECT id, name, author, date, created_at, used
FROM public.books_catalogue
WHERE industry_type = 'technology';

-- =====================================================
-- STEP 4: Optional - Add Partitioning for Large Tables
-- =====================================================

-- Create partitioned table for learning_sessions (by month)
-- This is optional but recommended for large datasets

-- Create the partitioned parent table with modified constraints
CREATE TABLE IF NOT EXISTS public.learning_sessions_partitioned (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    content_type text NOT NULL CHECK (content_type = ANY (ARRAY['article'::text, 'paper'::text, 'book'::text, 'insight'::text, 'quiz'::text, 'video'::text])),
    content_id bigint NOT NULL,
    session_start_time timestamp with time zone DEFAULT now(),
    session_end_time timestamp with time zone,
    duration_seconds integer CHECK (duration_seconds >= 0),
    interaction_events jsonb DEFAULT '[]'::jsonb,
    completion_percentage numeric DEFAULT 0 CHECK (completion_percentage >= 0::numeric AND completion_percentage <= 100::numeric),
    engagement_score numeric DEFAULT 0 CHECK (engagement_score >= 0::numeric AND engagement_score <= 10::numeric),
    session_quality_score integer CHECK (session_quality_score >= 1 AND session_quality_score <= 10),
    device_type text,
    referrer_source text,
    notes text,
    bookmarks jsonb DEFAULT '[]'::jsonb,
    quiz_score integer CHECK (quiz_score >= 0 AND quiz_score <= 100),
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    -- Primary key must include partition key
    CONSTRAINT learning_sessions_partitioned_pkey PRIMARY KEY (id, session_start_time),
    CONSTRAINT learning_sessions_partitioned_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
) PARTITION BY RANGE (session_start_time);

-- Create initial partitions for current and next few months
-- You can add more partitions as needed
CREATE TABLE IF NOT EXISTS public.learning_sessions_2025_08 
    PARTITION OF public.learning_sessions_partitioned
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE IF NOT EXISTS public.learning_sessions_2025_09 
    PARTITION OF public.learning_sessions_partitioned
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE IF NOT EXISTS public.learning_sessions_2025_10 
    PARTITION OF public.learning_sessions_partitioned
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- Note: To actually use partitioning, you would need to:
-- 1. Stop application writes
-- 2. Copy data from learning_sessions to learning_sessions_partitioned
-- 3. Rename tables to swap them
-- 4. Update application code to use the partitioned table
-- This is commented out for now as it requires application downtime

-- Alternative: Skip partitioning entirely if not needed
-- Comment out the entire STEP 4 section if you don't want partitioning

-- =====================================================
-- STEP 5: Cleanup Preparation
-- =====================================================

-- DO NOT DROP THE OLD TABLES YET!
-- These commands are for reference only - execute them AFTER confirming 
-- your application works with the new structure

/*
-- Commands to run AFTER testing and updating frontend code:

-- Drop old catalog tables (ONLY after confirming migration success)
DROP TABLE IF EXISTS public.business_books_catalogue;
DROP TABLE IF EXISTS public.education_books_catalogue;
DROP TABLE IF EXISTS public.finance_books_catalogue;
DROP TABLE IF EXISTS public.healthcare_books_catalogue;
DROP TABLE IF EXISTS public.personal_development_books_catalogue;
DROP TABLE IF EXISTS public.politics_books_catalogue;
DROP TABLE IF EXISTS public.science_books_catalogue;
DROP TABLE IF EXISTS public.startup_books_catalogue;
DROP TABLE IF EXISTS public.technology_books_catalogue;

-- Drop article_views_enhanced table (ONLY after confirming data migration)
DROP TABLE IF EXISTS public.article_views_enhanced;
*/

-- =====================================================
-- STEP 6: Verification Queries
-- =====================================================

-- Verify data migration was successful
SELECT 
    industry_type,
    COUNT(*) as book_count,
    COUNT(CASE WHEN used THEN 1 END) as used_count
FROM public.books_catalogue 
GROUP BY industry_type
ORDER BY industry_type;

-- Check for any data loss during article_views migration
SELECT 
    'article_views' as table_name,
    COUNT(*) as record_count
FROM public.article_views
UNION ALL
SELECT 
    'article_views_enhanced' as table_name,
    COUNT(*) as record_count
FROM public.article_views_enhanced;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename = 'books_catalogue'
ORDER BY tablename, indexname;

COMMIT;