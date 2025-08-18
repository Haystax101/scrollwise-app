-- This script adds ON DELETE CASCADE to foreign key constraints for insights, comments,
-- and other user-generated content. This ensures that deleting a parent record
-- (e.g., an insight) correctly cascades to delete all its associated child records
-- (e.g., likes, saves, comments).

BEGIN;

-- Drop and recreate foreign key constraints for insight-related tables
ALTER TABLE public.insight_comments
  DROP CONSTRAINT IF EXISTS insight_comments_insight_id_fkey,
  ADD CONSTRAINT insight_comments_insight_id_fkey
    FOREIGN KEY (insight_id)
    REFERENCES public.insights(id)
    ON DELETE CASCADE;

ALTER TABLE public.insight_likes
  DROP CONSTRAINT IF EXISTS insight_likes_insight_id_fkey,
  ADD CONSTRAINT insight_likes_insight_id_fkey
    FOREIGN KEY (insight_id)
    REFERENCES public.insights(id)
    ON DELETE CASCADE;

ALTER TABLE public.insight_responses
  DROP CONSTRAINT IF EXISTS insight_responses_insight_id_fkey,
  ADD CONSTRAINT insight_responses_insight_id_fkey
    FOREIGN KEY (insight_id)
    REFERENCES public.insights(id)
    ON DELETE CASCADE;

ALTER TABLE public.insight_saves
  DROP CONSTRAINT IF EXISTS insight_saves_insight_id_fkey,
  ADD CONSTRAINT insight_saves_insight_id_fkey
    FOREIGN KEY (insight_id)
    REFERENCES public.insights(id)
    ON DELETE CASCADE;

-- Drop and recreate foreign key constraints for article-related tables
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_article_id_fkey,
  ADD CONSTRAINT comments_article_id_fkey
    FOREIGN KEY (article_id)
    REFERENCES public.articles(id)
    ON DELETE CASCADE;

ALTER TABLE public.article_likes
  DROP CONSTRAINT IF EXISTS article_likes_article_id_fkey,
  ADD CONSTRAINT article_likes_article_id_fkey
    FOREIGN KEY (article_id)
    REFERENCES public.articles(id)
    ON DELETE CASCADE;

ALTER TABLE public.article_saves
  DROP CONSTRAINT IF EXISTS article_saves_article_id_fkey,
  ADD CONSTRAINT article_saves_article_id_fkey
    FOREIGN KEY (article_id)
    REFERENCES public.articles(id)
    ON DELETE CASCADE;

ALTER TABLE public.article_views
  DROP CONSTRAINT IF EXISTS article_views_article_id_fkey,
  ADD CONSTRAINT article_views_article_id_fkey
    FOREIGN KEY (article_id)
    REFERENCES public.articles(id)
    ON DELETE CASCADE;

-- Drop and recreate foreign key constraints for book-related tables
ALTER TABLE public.book_comments
  DROP CONSTRAINT IF EXISTS book_comments_book_id_fkey,
  ADD CONSTRAINT book_comments_book_id_fkey
    FOREIGN KEY (book_id)
    REFERENCES public.books(id)
    ON DELETE CASCADE;

ALTER TABLE public.book_likes
  DROP CONSTRAINT IF EXISTS book_likes_book_id_fkey,
  ADD CONSTRAINT book_likes_book_id_fkey
    FOREIGN KEY (book_id)
    REFERENCES public.books(id)
    ON DELETE CASCADE;

ALTER TABLE public.book_saves
  DROP CONSTRAINT IF EXISTS book_saves_book_id_fkey,
  ADD CONSTRAINT book_saves_book_id_fkey
    FOREIGN KEY (book_id)
    REFERENCES public.books(id)
    ON DELETE CASCADE;

ALTER TABLE public.book_views
  DROP CONSTRAINT IF EXISTS book_views_book_id_fkey,
  ADD CONSTRAINT book_views_book_id_fkey
    FOREIGN KEY (book_id)
    REFERENCES public.books(id)
    ON DELETE CASCADE;

-- Drop and recreate foreign key constraints for paper-related tables
ALTER TABLE public.paper_comments
  DROP CONSTRAINT IF EXISTS paper_comments_paper_id_fkey,
  ADD CONSTRAINT paper_comments_paper_id_fkey
    FOREIGN KEY (paper_id)
    REFERENCES public.papers(id)
    ON DELETE CASCADE;

ALTER TABLE public.paper_likes
  DROP CONSTRAINT IF EXISTS paper_likes_paper_id_fkey,
  ADD CONSTRAINT paper_likes_paper_id_fkey
    FOREIGN KEY (paper_id)
    REFERENCES public.papers(id)
    ON DELETE CASCADE;

ALTER TABLE public.paper_saves
  DROP CONSTRAINT IF EXISTS paper_saves_paper_id_fkey,
  ADD CONSTRAINT paper_saves_paper_id_fkey
    FOREIGN KEY (paper_id)
    REFERENCES public.papers(id)
    ON DELETE CASCADE;

ALTER TABLE public.paper_views
  DROP CONSTRAINT IF EXISTS paper_views_paper_id_fkey,
  ADD CONSTRAINT paper_views_paper_id_fkey
    FOREIGN KEY (paper_id)
    REFERENCES public.papers(id)
    ON DELETE CASCADE;

-- Drop and recreate foreign key constraints for quiz-related tables
ALTER TABLE public.quiz_attempts
  DROP CONSTRAINT IF EXISTS quiz_attempts_question_id_fkey,
  ADD CONSTRAINT quiz_attempts_question_id_fkey
    FOREIGN KEY (question_id)
    REFERENCES public.quiz_questions(id)
    ON DELETE CASCADE;

-- Drop and recreate foreign key constraints for chat-related tables
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_chat_id_fkey,
  ADD CONSTRAINT chat_messages_chat_id_fkey
    FOREIGN KEY (chat_id)
    REFERENCES public.chats(id)
    ON DELETE CASCADE;

-- Drop and recreate foreign key constraints for profile-related tables
-- This will cascade deletes from profiles to all user-specific data
ALTER TABLE public.insights
  DROP CONSTRAINT IF EXISTS insights_author_id_fkey,
  ADD CONSTRAINT insights_author_id_fkey
    FOREIGN KEY (author_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.xp_ledger
  DROP CONSTRAINT IF EXISTS xp_ledger_user_id_fkey,
  ADD CONSTRAINT xp_ledger_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.user_projects
  DROP CONSTRAINT IF EXISTS user_projects_user_id_fkey,
  ADD CONSTRAINT user_projects_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.user_industries
  DROP CONSTRAINT IF EXISTS user_industries_user_id_fkey,
  ADD CONSTRAINT user_industries_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.user_goals
  DROP CONSTRAINT IF EXISTS user_goals_user_id_fkey,
  ADD CONSTRAINT user_goals_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.user_goal_companies
  DROP CONSTRAINT IF EXISTS user_goal_companies_user_id_fkey,
  ADD CONSTRAINT user_goal_companies_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.user_experiences
  DROP CONSTRAINT IF EXISTS user_experiences_user_id_fkey,
  ADD CONSTRAINT user_experiences_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.user_education
  DROP CONSTRAINT IF EXISTS user_education_user_id_fkey,
  ADD CONSTRAINT user_education_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.search_analytics
  DROP CONSTRAINT IF EXISTS search_analytics_user_id_fkey,
  ADD CONSTRAINT search_analytics_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.reels
  DROP CONSTRAINT IF EXISTS reels_user_id_fkey,
  ADD CONSTRAINT reels_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.quiz_attempts
  DROP CONSTRAINT IF EXISTS quiz_attempts_user_id_fkey,
  ADD CONSTRAINT quiz_attempts_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.content_views
  DROP CONSTRAINT IF EXISTS content_views_user_id_fkey,
  ADD CONSTRAINT content_views_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.connections
  DROP CONSTRAINT IF EXISTS connections_user_id_1_fkey,
  ADD CONSTRAINT connections_user_id_1_fkey
    FOREIGN KEY (user_id_1)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.connections
  DROP CONSTRAINT IF EXISTS connections_user_id_2_fkey,
  ADD CONSTRAINT connections_user_id_2_fkey
    FOREIGN KEY (user_id_2)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey,
  ADD CONSTRAINT chat_messages_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

COMMIT;
