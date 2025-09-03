-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievement_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon_name text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievement_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['learning'::text, 'engagement'::text, 'streak'::text, 'milestone'::text, 'social'::text, 'skill'::text, 'completion'::text])),
  rarity text DEFAULT 'common'::text CHECK (rarity = ANY (ARRAY['common'::text, 'uncommon'::text, 'rare'::text, 'epic'::text, 'legendary'::text])),
  criteria jsonb NOT NULL,
  points_reward integer DEFAULT 0 CHECK (points_reward >= 0),
  voltz_reward integer DEFAULT 0 CHECK (voltz_reward >= 0),
  is_active boolean DEFAULT true,
  is_secret boolean DEFAULT false,
  unlock_order integer DEFAULT 0,
  prerequisite_achievement_ids ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.article_comment_likes (
  user_id uuid NOT NULL,
  comment_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT article_comment_likes_pkey PRIMARY KEY (user_id, comment_id),
  CONSTRAINT article_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id),
  CONSTRAINT article_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
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
  id integer NOT NULL DEFAULT nextval('article_views_id_seq'::regclass),
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT article_views_pkey PRIMARY KEY (id),
  CONSTRAINT article_views_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id),
  CONSTRAINT article_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.article_views_enhanced (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT article_views_enhanced_pkey PRIMARY KEY (id),
  CONSTRAINT article_views_enhanced_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id),
  CONSTRAINT article_views_enhanced_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.articles (
  id integer NOT NULL DEFAULT nextval('articles_id_seq'::regclass),
  title text NOT NULL,
  summary text NOT NULL UNIQUE,
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
  flag smallint NOT NULL DEFAULT '0'::smallint,
  longer_summary text,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.book_comment_likes (
  user_id uuid NOT NULL,
  comment_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT book_comment_likes_pkey PRIMARY KEY (user_id, comment_id),
  CONSTRAINT book_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.book_comments(id),
  CONSTRAINT book_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.book_comments (
  id bigint NOT NULL DEFAULT nextval('book_comments_id_seq'::regclass),
  user_id uuid NOT NULL,
  book_id bigint NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  parent_comment_id bigint,
  likes_count bigint NOT NULL DEFAULT 0,
  reply_count bigint NOT NULL DEFAULT 0,
  depth_level integer NOT NULL DEFAULT 0 CHECK (depth_level <= 3),
  CONSTRAINT book_comments_pkey PRIMARY KEY (id),
  CONSTRAINT book_comments_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT book_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT book_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.book_comments(id)
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
  CONSTRAINT book_views_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT book_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
  flag smallint NOT NULL DEFAULT '0'::smallint,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  CONSTRAINT books_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.books_catalogue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author text NOT NULL,
  date integer,
  industry_type text NOT NULL CHECK (industry_type = ANY (ARRAY['business'::text, 'education'::text, 'finance'::text, 'healthcare'::text, 'personal_development'::text, 'politics'::text, 'science'::text, 'startup'::text, 'technology'::text])),
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT books_catalogue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.business_books_catalogue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author text NOT NULL,
  date integer,
  created_at timestamp with time zone DEFAULT now(),
  used boolean DEFAULT false,
  CONSTRAINT business_books_catalogue_pkey PRIMARY KEY (id)
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
  participant_ids ARRAY NOT NULL,
  CONSTRAINT chats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comments (
  id bigint NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
  user_id uuid NOT NULL,
  article_id integer NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  parent_comment_id bigint,
  likes_count bigint NOT NULL DEFAULT 0,
  reply_count bigint NOT NULL DEFAULT 0,
  depth_level integer NOT NULL DEFAULT 0 CHECK (depth_level <= 3),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id),
  CONSTRAINT comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_normalized text,
  country_code text DEFAULT 'GB'::text,
  industry_sector text,
  company_number text,
  lei text,
  website_domain text,
  alt_names ARRAY DEFAULT '{}'::text[],
  employee_count_range text CHECK (employee_count_range = ANY (ARRAY['1-10'::text, '11-50'::text, '51-200'::text, '201-1000'::text, '1001-5000'::text, '5000+'::text])),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'dissolved'::text, 'dormant'::text])),
  popularity_score integer DEFAULT 0,
  search_vector tsvector,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.company_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  alias text NOT NULL,
  alias_type text CHECK (alias_type = ANY (ARRAY['trading_name'::text, 'previous_name'::text, 'abbreviation'::text, 'colloquial'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_aliases_pkey PRIMARY KEY (id),
  CONSTRAINT company_aliases_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.connections (
  user_id_1 uuid NOT NULL,
  user_id_2 uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT connections_pkey PRIMARY KEY (user_id_1, user_id_2),
  CONSTRAINT connections_user_id_1_fkey FOREIGN KEY (user_id_1) REFERENCES public.profiles(id),
  CONSTRAINT connections_user_id_2_fkey FOREIGN KEY (user_id_2) REFERENCES public.profiles(id)
);
CREATE TABLE public.content_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['article'::text, 'paper'::text, 'book'::text, 'insight'::text])),
  content_id bigint NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  view_duration integer DEFAULT 0,
  CONSTRAINT content_views_pkey PRIMARY KEY (id),
  CONSTRAINT content_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.degrees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT degrees_pkey PRIMARY KEY (id)
);
CREATE TABLE public.education_books_catalogue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author text NOT NULL,
  date integer,
  created_at timestamp with time zone DEFAULT now(),
  used boolean DEFAULT false,
  CONSTRAINT education_books_catalogue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.finance_books_catalogue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author text NOT NULL,
  date integer,
  created_at timestamp with time zone DEFAULT now(),
  used boolean DEFAULT false,
  CONSTRAINT finance_books_catalogue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.healthcare_books_catalogue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author text NOT NULL,
  date integer,
  created_at timestamp with time zone DEFAULT now(),
  used boolean DEFAULT false,
  CONSTRAINT healthcare_books_catalogue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.industries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon_name text,
  color text,
  category text,
  is_popular boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT industries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.insight_comment_likes (
  user_id uuid NOT NULL,
  comment_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insight_comment_likes_pkey PRIMARY KEY (user_id, comment_id),
  CONSTRAINT insight_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT insight_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.insight_comments(id)
);
CREATE TABLE public.insight_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  insight_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  likes_count bigint NOT NULL DEFAULT 0,
  parent_comment_id uuid,
  reply_count bigint NOT NULL DEFAULT 0,
  depth_level integer NOT NULL DEFAULT 0 CHECK (depth_level <= 3),
  CONSTRAINT insight_comments_pkey PRIMARY KEY (id),
  CONSTRAINT insight_comments_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id),
  CONSTRAINT insight_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT insight_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.insight_comments(id)
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
  CONSTRAINT insight_responses_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id),
  CONSTRAINT insight_responses_original_author_id_fkey FOREIGN KEY (original_author_id) REFERENCES public.profiles(id),
  CONSTRAINT insight_responses_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.insight_saves (
  user_id uuid NOT NULL,
  insight_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insight_saves_pkey PRIMARY KEY (user_id, insight_id),
  CONSTRAINT insight_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT insight_saves_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id)
);
CREATE TABLE public.insight_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  insight_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT insight_views_pkey PRIMARY KEY (id),
  CONSTRAINT insight_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT insight_views_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id)
);
CREATE TABLE public.insights (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  author_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  likes_count bigint NOT NULL DEFAULT 0,
  saves_count bigint NOT NULL DEFAULT 0,
  comments_count bigint NOT NULL DEFAULT 0,
  supercharged boolean DEFAULT false,
  voltz_spent integer DEFAULT 0,
  views_count bigint NOT NULL DEFAULT 0,
  flag smallint NOT NULL DEFAULT '0'::smallint,
  CONSTRAINT insights_pkey PRIMARY KEY (id),
  CONSTRAINT insights_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.leaderboard (
  user_id uuid NOT NULL,
  total_voltz_earned integer DEFAULT 0,
  full_name text,
  avatar_url text,
  CONSTRAINT leaderboard_pkey PRIMARY KEY (user_id),
  CONSTRAINT leaderboard_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.learning_sessions (
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
  CONSTRAINT learning_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT learning_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.learning_sessions_2025_08 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['article'::text, 'paper'::text, 'book'::text, 'insight'::text, 'quiz'::text, 'video'::text])),
  content_id bigint NOT NULL,
  session_start_time timestamp with time zone NOT NULL DEFAULT now(),
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
  CONSTRAINT learning_sessions_2025_08_pkey PRIMARY KEY (id, session_start_time),
  CONSTRAINT learning_sessions_partitioned_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.learning_sessions_2025_09 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['article'::text, 'paper'::text, 'book'::text, 'insight'::text, 'quiz'::text, 'video'::text])),
  content_id bigint NOT NULL,
  session_start_time timestamp with time zone NOT NULL DEFAULT now(),
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
  CONSTRAINT learning_sessions_2025_09_pkey PRIMARY KEY (id, session_start_time),
  CONSTRAINT learning_sessions_partitioned_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.learning_sessions_2025_10 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['article'::text, 'paper'::text, 'book'::text, 'insight'::text, 'quiz'::text, 'video'::text])),
  content_id bigint NOT NULL,
  session_start_time timestamp with time zone NOT NULL DEFAULT now(),
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
  CONSTRAINT learning_sessions_2025_10_pkey PRIMARY KEY (id, session_start_time),
  CONSTRAINT learning_sessions_partitioned_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.learning_sessions_partitioned (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['article'::text, 'paper'::text, 'book'::text, 'insight'::text, 'quiz'::text, 'video'::text])),
  content_id bigint NOT NULL,
  session_start_time timestamp with time zone NOT NULL DEFAULT now(),
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
  CONSTRAINT learning_sessions_partitioned_pkey PRIMARY KEY (id, session_start_time),
  CONSTRAINT learning_sessions_partitioned_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.occupation_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  occupation_id uuid NOT NULL,
  alias text NOT NULL,
  alias_type text CHECK (alias_type = ANY (ARRAY['lay_title'::text, 'industry_specific'::text, 'seniority_variant'::text, 'abbreviation'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT occupation_aliases_pkey PRIMARY KEY (id),
  CONSTRAINT occupation_aliases_occupation_id_fkey FOREIGN KEY (occupation_id) REFERENCES public.occupations(id)
);
CREATE TABLE public.occupations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_normalized text,
  onet_code text UNIQUE,
  esco_uri text,
  category text,
  alt_titles ARRAY DEFAULT '{}'::text[],
  required_skills ARRAY DEFAULT '{}'::text[],
  salary_range_gbp text,
  popularity_score integer DEFAULT 0,
  search_vector tsvector,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT occupations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.onboarding_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  step_name text NOT NULL,
  completed_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT onboarding_progress_pkey PRIMARY KEY (id),
  CONSTRAINT onboarding_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.paper_comment_likes (
  user_id uuid NOT NULL,
  comment_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT paper_comment_likes_pkey PRIMARY KEY (user_id, comment_id),
  CONSTRAINT paper_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT paper_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.paper_comments(id)
);
CREATE TABLE public.paper_comments (
  id bigint NOT NULL DEFAULT nextval('paper_comments_id_seq'::regclass),
  user_id uuid NOT NULL,
  paper_id bigint NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  parent_comment_id bigint,
  likes_count bigint NOT NULL DEFAULT 0,
  reply_count bigint NOT NULL DEFAULT 0,
  depth_level integer NOT NULL DEFAULT 0 CHECK (depth_level <= 3),
  CONSTRAINT paper_comments_pkey PRIMARY KEY (id),
  CONSTRAINT paper_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.paper_comments(id),
  CONSTRAINT paper_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT paper_comments_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id)
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
  flag smallint NOT NULL DEFAULT '0'::smallint,
  CONSTRAINT papers_pkey PRIMARY KEY (id),
  CONSTRAINT papers_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.personal_development_books_catalogue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author text NOT NULL,
  date integer,
  created_at timestamp with time zone DEFAULT now(),
  used boolean DEFAULT false,
  CONSTRAINT personal_development_books_catalogue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.politics_books_catalogue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author text NOT NULL,
  date integer,
  created_at timestamp with time zone DEFAULT now(),
  used boolean DEFAULT false,
  CONSTRAINT politics_books_catalogue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profile_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section_type text NOT NULL CHECK (section_type = ANY (ARRAY['summary'::text, 'skills'::text, 'interests'::text, 'custom'::text])),
  content text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_public boolean DEFAULT true,
  display_order integer DEFAULT 0,
  section_schema jsonb,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_sections_pkey PRIMARY KEY (id),
  CONSTRAINT profile_sections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
  spendable_voltz integer DEFAULT 100,
  bio text,
  profile_completion_percentage integer DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
  total_voltz_earned integer DEFAULT 0,
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
  CONSTRAINT quiz_attempts_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id),
  CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
  CONSTRAINT reels_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT reels_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.science_books_catalogue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author text NOT NULL,
  date integer,
  created_at timestamp with time zone DEFAULT now(),
  used boolean DEFAULT false,
  CONSTRAINT science_books_catalogue_pkey PRIMARY KEY (id)
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
CREATE TABLE public.skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_normalized text,
  category text,
  popularity_score integer DEFAULT 0,
  search_vector tsvector,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT skills_pkey PRIMARY KEY (id)
);
CREATE TABLE public.startup_books_catalogue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author text NOT NULL,
  date integer,
  created_at timestamp with time zone DEFAULT now(),
  used boolean DEFAULT false,
  CONSTRAINT startup_books_catalogue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.technology_books_catalogue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  author text NOT NULL,
  date integer,
  created_at timestamp with time zone DEFAULT now(),
  used boolean DEFAULT false,
  CONSTRAINT technology_books_catalogue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.universities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT universities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_achievement_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  progress_data jsonb DEFAULT '{}'::jsonb,
  current_value integer DEFAULT 0,
  target_value integer NOT NULL,
  last_progress_date timestamp with time zone DEFAULT now(),
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievement_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievement_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_achievement_progress_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text,
  icon_name text,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  progress_current integer DEFAULT 0 CHECK (progress_current >= 0),
  progress_total integer DEFAULT 1 CHECK (progress_total > 0),
  is_featured boolean DEFAULT false,
  notification_sent boolean DEFAULT false,
  achievement_id uuid,
  unlock_context jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.user_certifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  certification_name text NOT NULL,
  issuing_organization text NOT NULL,
  credential_id text,
  credential_url text,
  issue_date date,
  expiration_date date,
  is_active boolean DEFAULT true,
  verification_status text DEFAULT 'pending'::text CHECK (verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'expired'::text, 'revoked'::text])),
  certificate_file_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_certifications_pkey PRIMARY KEY (id),
  CONSTRAINT user_certifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_content_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['article'::text, 'paper'::text, 'book'::text, 'insight'::text])),
  content_id bigint NOT NULL,
  flagged_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_content_flags_pkey PRIMARY KEY (id),
  CONSTRAINT user_content_flags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_content_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['article'::text, 'paper'::text, 'book'::text, 'insight'::text, 'quiz'::text, 'video'::text])),
  content_id bigint NOT NULL,
  interaction_types ARRAY DEFAULT '{}'::text[],
  first_interaction_at timestamp with time zone DEFAULT now(),
  last_interaction_at timestamp with time zone DEFAULT now(),
  total_time_spent_seconds integer DEFAULT 0 CHECK (total_time_spent_seconds >= 0),
  interaction_count integer DEFAULT 1 CHECK (interaction_count >= 0),
  completion_status text DEFAULT 'started'::text CHECK (completion_status = ANY (ARRAY['started'::text, 'in_progress'::text, 'completed'::text, 'abandoned'::text])),
  engagement_score numeric DEFAULT 0 CHECK (engagement_score >= 0::numeric AND engagement_score <= 10::numeric),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_content_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT user_content_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_daily_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_date date NOT NULL,
  activity_types ARRAY DEFAULT '{}'::text[],
  total_minutes_active integer DEFAULT 0 CHECK (total_minutes_active >= 0),
  unique_content_pieces integer DEFAULT 0 CHECK (unique_content_pieces >= 0),
  interactions_count integer DEFAULT 0 CHECK (interactions_count >= 0),
  quality_score numeric DEFAULT 0.0 CHECK (quality_score >= 0.0 AND quality_score <= 10.0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_daily_activities_pkey PRIMARY KEY (id),
  CONSTRAINT user_daily_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_education (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  university_id uuid,
  degree_id uuid,
  stage text,
  degree_name text,
  major text,
  minor text,
  start_date date,
  end_date date,
  gpa numeric CHECK (gpa >= 0::numeric AND gpa <= 4.0),
  honors ARRAY,
  activities ARRAY,
  relevant_coursework ARRAY,
  graduation_status text DEFAULT 'graduated'::text CHECK (graduation_status = ANY (ARRAY['graduated'::text, 'in_progress'::text, 'dropped_out'::text, 'transferred'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  field_of_study text,
  is_current boolean DEFAULT false,
  university_name text,
  CONSTRAINT user_education_pkey PRIMARY KEY (id),
  CONSTRAINT user_education_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id),
  CONSTRAINT user_education_degree_id_fkey FOREIGN KEY (degree_id) REFERENCES public.degrees(id),
  CONSTRAINT user_education_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  company_id uuid,
  description text,
  experience_level text,
  position_title text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  company_logo_url text,
  location text,
  responsibilities ARRAY,
  key_achievements ARRAY,
  employment_type text CHECK (employment_type = ANY (ARRAY['full_time'::text, 'part_time'::text, 'contract'::text, 'internship'::text, 'freelance'::text, 'volunteer'::text])),
  industry text,
  skills_gained ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_experiences_pkey PRIMARY KEY (id),
  CONSTRAINT user_experiences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_experiences_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
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
  goal_type text DEFAULT 'career'::text CHECK (goal_type = ANY (ARRAY['career'::text, 'learning'::text, 'skill'::text, 'project'::text])),
  priority integer DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'paused'::text, 'cancelled'::text])),
  target_date date,
  description text,
  progress_percentage numeric DEFAULT 0 CHECK (progress_percentage >= 0::numeric AND progress_percentage <= 100::numeric),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT user_goals_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_industries (
  user_id uuid NOT NULL,
  industry_id uuid NOT NULL,
  stage text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_industries_pkey PRIMARY KEY (user_id, industry_id),
  CONSTRAINT user_industries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_industries_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id)
);
CREATE TABLE public.user_languages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  language_name text NOT NULL,
  proficiency_level text NOT NULL CHECK (proficiency_level = ANY (ARRAY['elementary'::text, 'limited_working'::text, 'professional'::text, 'full_professional'::text, 'native'::text])),
  is_native boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  certification_name text,
  certification_score text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_languages_pkey PRIMARY KEY (id),
  CONSTRAINT user_languages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_learning_analytics (
  user_id uuid NOT NULL,
  total_learning_time_minutes integer DEFAULT 0 CHECK (total_learning_time_minutes >= 0),
  total_sessions integer DEFAULT 0 CHECK (total_sessions >= 0),
  active_learning_days integer DEFAULT 0 CHECK (active_learning_days >= 0),
  avg_session_duration_minutes numeric DEFAULT 0 CHECK (avg_session_duration_minutes >= 0::numeric),
  content_completion_rate numeric DEFAULT 0 CHECK (content_completion_rate >= 0::numeric AND content_completion_rate <= 100::numeric),
  preferred_learning_times ARRAY DEFAULT '{}'::integer[],
  most_engaged_content_types ARRAY DEFAULT '{}'::text[],
  learning_streak_days integer DEFAULT 0 CHECK (learning_streak_days >= 0),
  weekly_learning_goal_completion numeric DEFAULT 0 CHECK (weekly_learning_goal_completion >= 0::numeric AND weekly_learning_goal_completion <= 200::numeric),
  monthly_minutes_target integer DEFAULT 480,
  monthly_minutes_current integer DEFAULT 0,
  total_unique_content_pieces integer DEFAULT 0,
  favorite_topics ARRAY DEFAULT '{}'::text[],
  learning_velocity numeric DEFAULT 0,
  retention_score numeric DEFAULT 0,
  last_calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_learning_analytics_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_learning_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_learning_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_type text NOT NULL CHECK (goal_type = ANY (ARRAY['minutes_weekly'::text, 'content_weekly'::text, 'topics_monthly'::text, 'completion_rate'::text])),
  target_value integer NOT NULL CHECK (target_value > 0),
  current_value integer DEFAULT 0 CHECK (current_value >= 0),
  tracking_period text NOT NULL CHECK (tracking_period = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text])),
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  achievement_rate numeric DEFAULT 0 CHECK (achievement_rate >= 0::numeric AND achievement_rate <= 200::numeric),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_learning_goals_pkey PRIMARY KEY (id),
  CONSTRAINT user_learning_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  description text,
  start_date date,
  end_date date,
  status text DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'paused'::text, 'cancelled'::text])),
  project_url text,
  github_url text,
  technologies ARRAY,
  is_featured boolean DEFAULT false,
  team_size integer CHECK (team_size >= 1),
  role_in_project text,
  project_category text CHECK (project_category = ANY (ARRAY['web_app'::text, 'mobile_app'::text, 'api'::text, 'data_analysis'::text, 'research'::text, 'design'::text, 'other'::text])),
  key_outcomes ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_projects_pkey PRIMARY KEY (id),
  CONSTRAINT user_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_publications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  publication_type text CHECK (publication_type = ANY (ARRAY['article'::text, 'research_paper'::text, 'book'::text, 'blog_post'::text, 'whitepaper'::text, 'case_study'::text])),
  publication_url text,
  published_date date,
  publisher text,
  co_authors ARRAY,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_publications_pkey PRIMARY KEY (id),
  CONSTRAINT user_publications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_skill_endorsements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL,
  endorsed_by_user_id uuid NOT NULL,
  endorsement_text text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_skill_endorsements_pkey PRIMARY KEY (id),
  CONSTRAINT user_skill_endorsements_endorsed_by_user_id_fkey FOREIGN KEY (endorsed_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_skill_endorsements_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.user_skills(id)
);
CREATE TABLE public.user_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_name text NOT NULL,
  skill_category text DEFAULT 'technical'::text CHECK (skill_category = ANY (ARRAY['technical'::text, 'soft'::text, 'language'::text, 'certification'::text, 'industry_specific'::text])),
  proficiency_level text DEFAULT 'intermediate'::text CHECK (proficiency_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'expert'::text])),
  years_experience numeric CHECK (years_experience >= 0::numeric AND years_experience <= 50::numeric),
  is_featured boolean DEFAULT false,
  endorsement_count integer DEFAULT 0 CHECK (endorsement_count >= 0),
  skill_description text,
  acquired_date date,
  last_used_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_skills_pkey PRIMARY KEY (id),
  CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  streak_type text NOT NULL DEFAULT 'daily_learning'::text CHECK (streak_type = ANY (ARRAY['daily_learning'::text, 'weekly_content'::text, 'monthly_engagement'::text])),
  target_days integer NOT NULL CHECK (target_days > 0),
  current_streak integer DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date date,
  streak_goal_set_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_streaks_pkey PRIMARY KEY (id),
  CONSTRAINT user_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
  transaction_type text DEFAULT 'earned'::text CHECK (transaction_type = ANY (ARRAY['earned'::text, 'spent'::text])),
  CONSTRAINT xp_ledger_pkey PRIMARY KEY (id),
  CONSTRAINT xp_ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);