-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.article_likes (
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT article_likes_pkey PRIMARY KEY (user_id, article_id),
  CONSTRAINT article_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT article_likes_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.article_saves (
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT article_saves_pkey PRIMARY KEY (user_id, article_id),
  CONSTRAINT article_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT article_saves_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.article_views (
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  id integer NOT NULL DEFAULT nextval('article_views_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT article_views_pkey PRIMARY KEY (id),
  CONSTRAINT article_views_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id),
  CONSTRAINT article_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.articles (
  title text NOT NULL,
  link text NOT NULL UNIQUE,
  site_name text,
  date date,
  industry_id uuid,
  search_vector tsvector,
  id integer NOT NULL DEFAULT nextval('articles_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  likes_count bigint NOT NULL DEFAULT 0,
  saves_count bigint NOT NULL DEFAULT 0,
  comments_count bigint NOT NULL DEFAULT 0,
  views_count bigint NOT NULL DEFAULT 0,
  summary text NOT NULL,
  embedding USER-DEFINED,
  author text,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.book_comments (
  user_id uuid NOT NULL,
  book_id bigint NOT NULL,
  content text NOT NULL,
  id bigint NOT NULL DEFAULT nextval('book_comments_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT book_comments_pkey PRIMARY KEY (id),
  CONSTRAINT book_comments_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT book_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.book_likes (
  user_id uuid NOT NULL,
  book_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT book_likes_pkey PRIMARY KEY (user_id, book_id),
  CONSTRAINT book_likes_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT book_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.book_saves (
  user_id uuid NOT NULL,
  book_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT book_saves_pkey PRIMARY KEY (user_id, book_id),
  CONSTRAINT book_saves_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT book_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.book_views (
  user_id uuid NOT NULL,
  book_id bigint NOT NULL,
  id bigint NOT NULL DEFAULT nextval('book_views_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT book_views_pkey PRIMARY KEY (id),
  CONSTRAINT book_views_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT book_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.books (
  key_insights ARRAY,
  search_vector tsvector,
  title text NOT NULL,
  author text NOT NULL,
  year integer,
  short_summary text NOT NULL,
  industry_id uuid,
  embedding USER-DEFINED,
  id bigint NOT NULL DEFAULT nextval('books_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  likes_count bigint NOT NULL DEFAULT 0,
  saves_count bigint NOT NULL DEFAULT 0,
  comments_count bigint NOT NULL DEFAULT 0,
  views_count bigint NOT NULL DEFAULT 0,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  CONSTRAINT books_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.chat_messages (
  chat_id uuid,
  sender_id uuid,
  content text NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.chats (
  participant_ids ARRAY NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comments (
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  content text NOT NULL,
  id bigint NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.companies (
  name text NOT NULL UNIQUE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.connections (
  user_id_1 uuid NOT NULL,
  user_id_2 uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT connections_pkey PRIMARY KEY (user_id_1, user_id_2),
  CONSTRAINT connections_user_id_2_fkey FOREIGN KEY (user_id_2) REFERENCES public.profiles(id),
  CONSTRAINT connections_user_id_1_fkey FOREIGN KEY (user_id_1) REFERENCES public.profiles(id)
);
CREATE TABLE public.degrees (
  name text NOT NULL UNIQUE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT degrees_pkey PRIMARY KEY (id)
);
CREATE TABLE public.industries (
  name text NOT NULL UNIQUE,
  description text,
  icon_name text,
  color text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT industries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.insight_responses (
  responder_id uuid,
  original_author_id uuid,
  content text NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  insight_id uuid,
  CONSTRAINT insight_responses_pkey PRIMARY KEY (id),
  CONSTRAINT insight_responses_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES public.profiles(id),
  CONSTRAINT insight_responses_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id),
  CONSTRAINT insight_responses_original_author_id_fkey FOREIGN KEY (original_author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.insights (
  author_id uuid,
  content text NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT insights_pkey PRIMARY KEY (id),
  CONSTRAINT insights_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.paper_comments (
  user_id uuid NOT NULL,
  paper_id bigint NOT NULL,
  content text NOT NULL,
  id bigint NOT NULL DEFAULT nextval('paper_comments_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT paper_comments_pkey PRIMARY KEY (id),
  CONSTRAINT paper_comments_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id),
  CONSTRAINT paper_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.paper_likes (
  user_id uuid NOT NULL,
  paper_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT paper_likes_pkey PRIMARY KEY (user_id, paper_id),
  CONSTRAINT paper_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT paper_likes_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id)
);
CREATE TABLE public.paper_saves (
  user_id uuid NOT NULL,
  paper_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT paper_saves_pkey PRIMARY KEY (user_id, paper_id),
  CONSTRAINT paper_saves_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id),
  CONSTRAINT paper_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.paper_views (
  user_id uuid NOT NULL,
  paper_id bigint NOT NULL,
  id bigint NOT NULL DEFAULT nextval('paper_views_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paper_views_pkey PRIMARY KEY (id),
  CONSTRAINT paper_views_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id),
  CONSTRAINT paper_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.papers (
  title text NOT NULL,
  content_simple text NOT NULL,
  content_complex text NOT NULL,
  authors ARRAY NOT NULL,
  link text NOT NULL UNIQUE,
  site_name text,
  date date,
  industry_id uuid,
  search_vector tsvector,
  embedding USER-DEFINED,
  id bigint NOT NULL DEFAULT nextval('papers_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  likes_count bigint NOT NULL DEFAULT 0,
  saves_count bigint NOT NULL DEFAULT 0,
  comments_count bigint NOT NULL DEFAULT 0,
  views_count bigint NOT NULL DEFAULT 0,
  CONSTRAINT papers_pkey PRIMARY KEY (id),
  CONSTRAINT papers_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  videos_watched integer DEFAULT 0,
  minutes_learned integer DEFAULT 0,
  days_streak integer DEFAULT 0,
  theme_preference text NOT NULL DEFAULT 'system'::text CHECK (theme_preference = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  pro_plan boolean NOT NULL DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reels (
  user_id uuid NOT NULL,
  industry_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  caption text,
  source_url text,
  video_url text,
  content ARRAY,
  id bigint NOT NULL DEFAULT nextval('reels_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  likes_count integer DEFAULT 0,
  saves_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  CONSTRAINT reels_pkey PRIMARY KEY (id),
  CONSTRAINT reels_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT reels_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.search_analytics (
  query text NOT NULL,
  user_id uuid,
  results_count integer,
  id integer NOT NULL DEFAULT nextval('search_analytics_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT search_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT search_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.universities (
  name text NOT NULL UNIQUE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT universities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_education (
  user_id uuid NOT NULL,
  university_id uuid NOT NULL,
  degree_id uuid NOT NULL,
  stage text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT user_education_pkey PRIMARY KEY (id),
  CONSTRAINT user_education_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_education_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id),
  CONSTRAINT user_education_degree_id_fkey FOREIGN KEY (degree_id) REFERENCES public.degrees(id)
);
CREATE TABLE public.user_experiences (
  user_id uuid,
  company_id uuid,
  description text,
  experience_level text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT user_experiences_pkey PRIMARY KEY (id),
  CONSTRAINT user_experiences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_experiences_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.user_goal_companies (
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  CONSTRAINT user_goal_companies_pkey PRIMARY KEY (user_id, company_id),
  CONSTRAINT user_goal_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT user_goal_companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_goals (
  timeframe text,
  user_id uuid NOT NULL,
  goal text,
  CONSTRAINT user_goals_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_industries (
  user_id uuid NOT NULL,
  industry_id uuid NOT NULL,
  stage text,
  CONSTRAINT user_industries_pkey PRIMARY KEY (user_id, industry_id),
  CONSTRAINT user_industries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_industries_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.user_projects (
  user_id uuid,
  title text,
  description text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT user_projects_pkey PRIMARY KEY (id),
  CONSTRAINT user_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);