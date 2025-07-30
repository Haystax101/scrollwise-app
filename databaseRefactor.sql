BEGIN;

-- 1. Drop dependent views and tables that will be recreated or are no longer needed.
-- Drop views that depend on the tables to be altered
DROP VIEW IF EXISTS public.user_profile_view; -- Example view, replace with actual view names if any

-- Drop tables with foreign key constraints first
DROP TABLE IF EXISTS public.article_likes;
DROP TABLE IF EXISTS public.article_saves;
DROP TABLE IF EXISTS public.article_views;
DROP TABLE IF EXISTS public.comments;
DROP TABLE IF EXISTS public.reels;
DROP TABLE IF EXISTS public.articles;
DROP TABLE IF EXISTS public.user_industries;
DROP TABLE IF EXISTS public.user_degrees;
DROP TABLE IF EXISTS public.user_universities;
DROP TABLE IF EXISTS public.user_experiences;
DROP TABLE IF EXISTS public.user_goal_companies;
DROP TABLE IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.user_skills;

-- Drop the old dimension tables
DROP TABLE IF EXISTS public.industries;
DROP TABLE IF EXISTS public.industries_canonical;
DROP TABLE IF EXISTS public.skills;

-- 2. Create the new, consolidated `industries` table with a UUID primary key
CREATE TABLE public.industries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon_name text,
  color text,
  CONSTRAINT industries_pkey PRIMARY KEY (id)
);

-- 3. Recreate tables with updated foreign key references

-- Recreate user_industries to link to the new industries table
CREATE TABLE public.user_industries (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  industry_id uuid NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  stage text,
  CONSTRAINT user_industries_pkey PRIMARY KEY (user_id, industry_id)
);

-- Recreate articles to link to the new industries table
CREATE TABLE public.articles (
  id serial PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  authors text[],
  link text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  type text,
  site_name text,
  date date,
  industry_id uuid REFERENCES public.industries(id),
  likes_count bigint DEFAULT 0 NOT NULL,
  saves_count bigint DEFAULT 0 NOT NULL,
  comments_count bigint DEFAULT 0 NOT NULL,
  views_count bigint DEFAULT 0 NOT NULL,
  search_vector tsvector
);

-- Recreate reels to link to the new industries table
CREATE TABLE public.reels (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  industry_id uuid NOT NULL REFERENCES public.industries(id),
  type text NOT NULL,
  title text NOT NULL,
  caption text,
  source_url text,
  video_url text,
  likes_count integer DEFAULT 0,
  saves_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  content text[]
);

-- 4. Create the new `user_education` table
CREATE TABLE public.user_education (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  degree_id uuid NOT NULL REFERENCES public.degrees(id) ON DELETE CASCADE,
  stage text,
  CONSTRAINT user_education_pkey PRIMARY KEY (id)
);

-- 5. Alter the `user_goals` table to add the timeframe
ALTER TABLE public.user_goals
ADD COLUMN timeframe text;

-- 6. Recreate the simplified `user_experiences` table
CREATE TABLE public.user_experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  description text,
  experience_level text,
  CONSTRAINT user_experiences_pkey PRIMARY KEY (id)
);

-- 7. Alter the `profiles` table to remove redundant columns
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS experience,
DROP COLUMN IF EXISTS interests,
DROP COLUMN IF EXISTS interests_names_backup;

-- 8. Recreate the dropped relational tables (likes, saves, etc.)

CREATE TABLE public.article_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  article_id integer NOT NULL REFERENCES public.articles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);

CREATE TABLE public.article_saves (
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  article_id integer NOT NULL REFERENCES public.articles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);

CREATE TABLE public.article_views (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  article_id integer NOT NULL REFERENCES public.articles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.comments (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  article_id integer NOT NULL REFERENCES public.articles(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_goal_companies (
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  PRIMARY KEY (user_id, company_id)
);

COMMIT;