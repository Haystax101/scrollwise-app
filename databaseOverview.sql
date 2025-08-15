-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.article_likes (
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT article_likes_pkey PRIMARY KEY (user_id, article_id),
  CONSTRAINT article_likes_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id),
  CONSTRAINT article_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
  id integer NOT NULL DEFAULT nextval('article_views_id_seq'::regclass),
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT article_views_pkey PRIMARY KEY (id),
  CONSTRAINT article_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT article_views_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.articles (
  id integer NOT NULL DEFAULT nextval('articles_id_seq'::regclass),
  title text NOT NULL,
  summary text NOT NULL,
  link text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  site_name text,
  date date,
  industry_id uuid,
  likes_count bigint NOT NULL DEFAULT 0,
  saves_count bigint NOT NULL DEFAULT 0,
  comments_count bigint NOT NULL DEFAULT 0,
  views_count bigint NOT NULL DEFAULT 0,
  search_vector tsvector,
  embedding USER-DEFINED,
  author text,
  questions ARRAY,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.book_comments (
  id bigint NOT NULL DEFAULT nextval('book_comments_id_seq'::regclass),
  user_id uuid NOT NULL,
  book_id bigint NOT NULL,
  content text NOT NULL,
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
  CONSTRAINT book_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT book_likes_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id)
);
CREATE TABLE public.book_saves (
  user_id uuid NOT NULL,
  book_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT book_saves_pkey PRIMARY KEY (user_id, book_id),
  CONSTRAINT book_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT book_saves_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id)
);
CREATE TABLE public.book_views (
  id bigint NOT NULL DEFAULT nextval('book_views_id_seq'::regclass),
  user_id uuid NOT NULL,
  book_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT book_views_pkey PRIMARY KEY (id),
  CONSTRAINT book_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT book_views_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id)
);
CREATE TABLE public.books (
  id bigint NOT NULL DEFAULT nextval('books_id_seq'::regclass),
  title text NOT NULL,
  author text NOT NULL,
  year integer,
  short_summary text NOT NULL,
  industry_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  embedding USER-DEFINED,
  likes_count bigint NOT NULL DEFAULT 0,
  saves_count bigint NOT NULL DEFAULT 0,
  comments_count bigint NOT NULL DEFAULT 0,
  views_count bigint NOT NULL DEFAULT 0,
  key_insights ARRAY,
  search_vector tsvector,
  questions ARRAY,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  CONSTRAINT books_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  chat_id uuid,
  sender_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  participant_ids ARRAY NOT NULL,
  CONSTRAINT chats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comments (
  id bigint NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.connections (
  user_id_1 uuid NOT NULL,
  user_id_2 uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT connections_pkey PRIMARY KEY (user_id_1, user_id_2),
  CONSTRAINT connections_user_id_1_fkey FOREIGN KEY (user_id_1) REFERENCES public.profiles(id),
  CONSTRAINT connections_user_id_2_fkey FOREIGN KEY (user_id_2) REFERENCES public.profiles(id)
);
CREATE TABLE public.degrees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT degrees_pkey PRIMARY KEY (id)
);
CREATE TABLE public.industries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon_name text,
  color text,
  CONSTRAINT industries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.insight_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  insight_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insight_comments_pkey PRIMARY KEY (id),
  CONSTRAINT insight_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT insight_comments_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id)
);
CREATE TABLE public.insight_likes (
  user_id uuid NOT NULL,
  insight_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insight_likes_pkey PRIMARY KEY (user_id, insight_id),
  CONSTRAINT insight_likes_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id),
  CONSTRAINT insight_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
CREATE TABLE public.insight_saves (
  user_id uuid NOT NULL,
  insight_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insight_saves_pkey PRIMARY KEY (user_id, insight_id),
  CONSTRAINT insight_saves_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id),
  CONSTRAINT insight_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.insights (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  author_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  likes_count bigint NOT NULL DEFAULT 0,
  saves_count bigint NOT NULL DEFAULT 0,
  comments_count bigint NOT NULL DEFAULT 0,
  CONSTRAINT insights_pkey PRIMARY KEY (id),
  CONSTRAINT insights_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.paper_comments (
  id bigint NOT NULL DEFAULT nextval('paper_comments_id_seq'::regclass),
  user_id uuid NOT NULL,
  paper_id bigint NOT NULL,
  content text NOT NULL,
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
  CONSTRAINT paper_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT paper_saves_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id)
);
CREATE TABLE public.paper_views (
  id bigint NOT NULL DEFAULT nextval('paper_views_id_seq'::regclass),
  user_id uuid NOT NULL,
  paper_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paper_views_pkey PRIMARY KEY (id),
  CONSTRAINT paper_views_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id),
  CONSTRAINT paper_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.papers (
  id bigint NOT NULL DEFAULT nextval('papers_id_seq'::regclass),
  title text NOT NULL,
  content_simple text NOT NULL,
  content_complex text NOT NULL,
  authors ARRAY NOT NULL,
  link text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  site_name text,
  date date,
  industry_id uuid,
  likes_count bigint NOT NULL DEFAULT 0,
  saves_count bigint NOT NULL DEFAULT 0,
  comments_count bigint NOT NULL DEFAULT 0,
  views_count bigint NOT NULL DEFAULT 0,
  search_vector tsvector,
  embedding USER-DEFINED,
  questions ARRAY,
  CONSTRAINT papers_pkey PRIMARY KEY (id),
  CONSTRAINT papers_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
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
  pro_plan boolean NOT NULL DEFAULT false,
  xp bigint NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_correct boolean,
  selected_option_index integer CHECK (selected_option_index >= 0 AND selected_option_index <= 3),
  CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT quiz_attempts_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id)
);
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['article'::text, 'paper'::text, 'book'::text])),
  content_id bigint NOT NULL,
  question text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_option_index integer CHECK (correct_option_index >= 0 AND correct_option_index <= 3),
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reels (
  id bigint NOT NULL DEFAULT nextval('reels_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  industry_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  caption text,
  source_url text,
  video_url text,
  likes_count integer DEFAULT 0,
  saves_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  content ARRAY,
  CONSTRAINT reels_pkey PRIMARY KEY (id),
  CONSTRAINT reels_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id),
  CONSTRAINT reels_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.search_analytics (
  id integer NOT NULL DEFAULT nextval('search_analytics_id_seq'::regclass),
  query text NOT NULL,
  user_id uuid,
  results_count integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT search_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT search_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.universities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT universities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_education (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  university_id uuid NOT NULL,
  degree_id uuid NOT NULL,
  stage text,
  CONSTRAINT user_education_pkey PRIMARY KEY (id),
  CONSTRAINT user_education_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_education_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id),
  CONSTRAINT user_education_degree_id_fkey FOREIGN KEY (degree_id) REFERENCES public.degrees(id)
);
CREATE TABLE public.user_experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  company_id uuid,
  description text,
  experience_level text,
  CONSTRAINT user_experiences_pkey PRIMARY KEY (id),
  CONSTRAINT user_experiences_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT user_experiences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_goal_companies (
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  CONSTRAINT user_goal_companies_pkey PRIMARY KEY (user_id, company_id),
  CONSTRAINT user_goal_companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_goal_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.user_goals (
  user_id uuid NOT NULL,
  goal text,
  timeframe text,
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
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  description text,
  CONSTRAINT user_projects_pkey PRIMARY KEY (id),
  CONSTRAINT user_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.xp_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount <> 0),
  reason text NOT NULL,
  subject_type text,
  subject_id text,
  actor_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xp_ledger_pkey PRIMARY KEY (id),
  CONSTRAINT xp_ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);