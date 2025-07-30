# LATEST_KNOWLEDGE.md

This document serves as a comprehensive record of the debugging, refactoring, and code updates performed on the `AcademicReels-3` project. It aims to provide a clear reference for future development.

## I. Project Overview

*   **Project Name:** AcademicReels-3
*   **Current Working Directory:** `/Users/gdwha/AcademicReels-3`
*   **Operating System:** darwin
*   **Key Areas of Focus:** Supabase Edge Functions, Database Schema, React Native Components.

## II. Supabase Onboarding Edge Function Debugging (`supabase/functions/onboarding/index.ts`)

### Initial Problem

The `onboarding` Supabase Edge Function was not successfully updating database tables, despite logs indicating successful execution.

### Debugging Process & Discoveries

1.  **Initial Logging:** Added extensive `console.log` statements throughout the function to trace execution flow and inspect data payloads.
2.  **Data Structure Mismatch (Frontend vs. Backend Expectation):**
    *   `industries`: Expected an array, received an object `{ selectedIndustries: [...] }`.
    *   `workExperience`: Frontend sent `workExperience`, backend expected `experiences`.
    *   `education`: Frontend sent a single object, backend expected an array.
    *   `careerGoals`: Frontend sent `careerGoals`, backend expected `career_goals`.
    *   `projects`: Frontend sent `project.name`, backend expected `project.title`.
3.  **RLS Violations & UUID Type Mismatch:** Even after correcting data structure parsing, database updates failed with two primary errors:
    *   `new row violates row-level security policy for table "..."` (RLS violations).
    *   `invalid input syntax for type uuid: "1"` (UUID type mismatch).

### Solutions Implemented

1.  **Corrected Data Structure Parsing:** Modified the `onboarding/index.ts` to correctly destructure and process the incoming JSON payload from the frontend, aligning variable names and expected array/object structures.
2.  **Resolved RLS Violations (Service Role Key):**
    *   **Problem:** The edge function, despite passing user authentication, was encountering RLS policies because database operations were not being performed with sufficient privileges in the server-side context.
    *   **Solution:** Initialized a `supabaseAdmin` client within the edge function using the `SUPABASE_SERVICE_ROLE_KEY`. This key bypasses RLS and is secure in a server-side environment *because* user authentication is performed first using the standard client. Database operations are then executed via `supabaseAdmin`.
    *   **Action Required (User):** Set the `SUPABASE_SERVICE_ROLE_KEY` environment variable in your Supabase project settings (under `Settings` > `API` > `service_role` key) and via `supabase secrets set --env-file ./supabase/.env.local` for local development and deployment.
3.  **Resolved UUID Type Mismatch (Foreign Key Lookups):**
    *   **Problem:** Frontend was sending integer IDs (e.g., `industry.id` as `1`, `2`, `3`) for foreign keys (`industry_id`, `degree_id`, `university_id`) that were defined as `uuid` in the database.
    *   **Solution:** Implemented lookup queries within the `onboarding` edge function to fetch the correct `uuid` from the canonical tables (`industries`, `degrees`, `universities`) based on the provided integer name/ID before performing the `upsert`/`insert` operation.

## III. Database Schema Refactoring

### Motivation

To improve data storage efficiency, remove redundancy, and better align the database schema with the data collected during user onboarding.

### Refactoring Plan (`databaseRefactorPlan.md`)

*   **Consolidate Industry Tables:** Merged `industries` (bigint PK) and `industries_canonical` (uuid PK) into a single `industries` table with a `uuid` primary key. Updated foreign key references in `user_industries`, `articles`, and `reels`.
*   **Restructure Education Data:** Replaced separate `user_degrees` and `user_universities` tables with a single `user_education` table to properly link user, university, degree, and stage.
*   **Refine Career Goal Storage:** Added a `timeframe` column to `user_goals` and dropped the redundant `user_roles` table.
*   **Simplify Experience Data:** Removed `title`, `start_date`, and `end_date` columns from `user_experiences` to streamline it to `description`, `company_id`, and `experience_level`.
*   **Remove Unused Skills Tables:** Dropped `skills` and `user_skills` tables as they are no longer used in the onboarding flow.
*   **Clean Up `profiles` Table:** Removed `experience`, `interests`, and `interests_names_backup` columns, as this data is now stored in normalized tables.

### SQL Script (`databaseRefactor_v2.sql`)

A comprehensive SQL script was provided to execute these changes transactionally. It explicitly drops dependent objects in reverse order of dependency (including the `article_stats` view, which was identified as a dependency during execution) to avoid the need for `CASCADE` and ensure data integrity.

### RLS Policies Re-application (`rls_policies.sql`)

After the schema refactoring, a SQL script was provided to re-apply and enable RLS policies on all affected tables, ensuring appropriate access control (owner-only for user data, public read for canonical/content).

## IV. Application Code Updates

Following the database refactoring, the application code was updated to reflect the new schema.

1.  **`supabase/functions/onboarding/index.ts`:**
    *   Updated to insert into the new `user_education` table.
    *   Simplified `user_experiences` insertion to match the new table structure.
    *   Included `timeframe` when upserting into `user_goals`.
    *   Ensured `industry_id` is correctly looked up as a UUID before insertion into `user_industries`.

2.  **`components/Profile.tsx`:**
    *   Removed `interests` from the `profiles` table `select` query.
    *   Added a new query to fetch user interests from the `user_industries` table.
    *   Updated the `article_saves` query to select all columns from the `articles` table.

3.  **`lib/feedAlgorithm.ts`:**
    *   Updated `FetchedArticle` interface to reflect `industry_id` as a `string` (UUID).
    *   Modified `fetchArticleByTypeAndIndustry` and `fetchSpecificArticle` to use `select('*')` for `articles` and to correctly query `industry_id` as a UUID.
    *   Updated `mapToArticle` to handle the new `industry_id` type.

4.  **`components/SavedFeed.tsx`:**
    *   Updated the `article_saves` query to select all columns from the `articles` table (`articles (*)`) to align with the new schema.

5.  **`lib/searchService.ts`:**
    *   Identified that the core search logic resides in a PostgreSQL RPC function `search_articles`.
    *   **Action Required (User):** Provided SQL to update the `search_articles` database function to use `uuid` for `industry_filter` and reflect the new `articles` table structure.

6.  **`components/Insights.tsx`:**
    *   Updated queries to `insight_responses` and `insights` to remove the `experience` column from the `profiles` join, as it no longer exists.

7.  **`components/Discover.tsx`:**
    *   **NOTE:** While `lib/searchService.ts` (which `Discover.tsx` relies on) and the `search_articles` database function were updated, `Discover.tsx` itself did not receive direct modifications during this session. It is crucial to verify its functionality with the new schema and updated search service. This remains a potential area for future attention if issues arise.

## V. Current Database Schema (Post-Refactoring)

```sql
-- WARNING: This schema is for context only and is not meant to be run directly.
-- It represents the intended state after all refactoring steps.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  avatar_url text,
  videos_watched integer DEFAULT 0,
  minutes_learned integer DEFAULT 0,
  days_streak integer DEFAULT 0,
  email text,
  theme_preference text NOT NULL DEFAULT 'system'::text CHECK (theme_preference = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.industries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon_name text,
  color text,
  CONSTRAINT industries_pkey PRIMARY KEY (id)
);

CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);

CREATE TABLE public.universities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT universities_pkey PRIMARY KEY (id)
);

CREATE TABLE public.degrees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT degrees_pkey PRIMARY KEY (id)
);

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

CREATE TABLE public.user_industries (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  industry_id uuid NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  stage text,
  CONSTRAINT user_industries_pkey PRIMARY KEY (user_id, industry_id)
);

CREATE TABLE public.user_education (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  degree_id uuid NOT NULL REFERENCES public.degrees(id) ON DELETE CASCADE,
  stage text,
  CONSTRAINT user_education_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  description text,
  experience_level text,
  CONSTRAINT user_experiences_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  description text,
  CONSTRAINT user_projects_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_goals (
  user_id uuid NOT NULL,
  goal text,
  timeframe text,
  CONSTRAINT user_goals_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.user_goal_companies (
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  CONSTRAINT user_goal_companies_pkey PRIMARY KEY (user_id, company_id),
  CONSTRAINT user_goal_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT user_goal_companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

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

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  chat_id uuid,
  sender_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  participant_ids uuid[] NOT NULL,
  CONSTRAINT chats_pkey PRIMARY KEY (id)
);

CREATE TABLE public.connections (
  user_id_1 uuid NOT NULL,
  user_id_2 uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT connections_pkey PRIMARY KEY (user_id_1, user_id_2),
  CONSTRAINT connections_user_id_1_fkey FOREIGN KEY (user_id_1) REFERENCES public.profiles(id),
  CONSTRAINT connections_user_id_2_fkey FOREIGN KEY (user_id_2) REFERENCES public.profiles(id)
);

CREATE TABLE public.insight_responses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  responder_id uuid,
  original_author_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  insight_id uuid,
  CONSTRAINT insight_responses_pkey PRIMARY KEY (id),
  CONSTRAINT insight_responses_original_author_id_fkey FOREIGN KEY (original_author_id) REFERENCES public.profiles(id),
  CONSTRAINT insight_responses_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id),
  CONSTRAINT insight_responses_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.insights (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  author_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT insights_pkey PRIMARY KEY (id),
  CONSTRAINT insights_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.search_analytics (
  id serial PRIMARY KEY,
  query text NOT NULL,
  user_id uuid REFERENCES public.profiles(id),
  results_count integer,
  created_at timestamptz DEFAULT now()
);
```
