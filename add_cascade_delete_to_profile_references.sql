-- Add ON DELETE CASCADE to all foreign key constraints that reference profiles table
-- This allows profiles to be deleted without being blocked by foreign key relations
-- All related data (likes, saves, comments, etc.) will be automatically deleted when a profile is deleted

BEGIN;

-- Article-related tables
ALTER TABLE public.article_comment_likes 
  DROP CONSTRAINT IF EXISTS article_comment_likes_user_id_fkey,
  ADD CONSTRAINT article_comment_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.article_likes 
  DROP CONSTRAINT IF EXISTS article_likes_user_id_fkey,
  ADD CONSTRAINT article_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.article_saves 
  DROP CONSTRAINT IF EXISTS article_saves_user_id_fkey,
  ADD CONSTRAINT article_saves_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.article_views 
  DROP CONSTRAINT IF EXISTS article_views_user_id_fkey,
  ADD CONSTRAINT article_views_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.article_views_enhanced 
  DROP CONSTRAINT IF EXISTS article_views_enhanced_user_id_fkey,
  ADD CONSTRAINT article_views_enhanced_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Book-related tables
ALTER TABLE public.book_comment_likes 
  DROP CONSTRAINT IF EXISTS book_comment_likes_user_id_fkey,
  ADD CONSTRAINT book_comment_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.book_comments 
  DROP CONSTRAINT IF EXISTS book_comments_user_id_fkey,
  ADD CONSTRAINT book_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.book_likes 
  DROP CONSTRAINT IF EXISTS book_likes_user_id_fkey,
  ADD CONSTRAINT book_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.book_saves 
  DROP CONSTRAINT IF EXISTS book_saves_user_id_fkey,
  ADD CONSTRAINT book_saves_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.book_views 
  DROP CONSTRAINT IF EXISTS book_views_user_id_fkey,
  ADD CONSTRAINT book_views_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Chat and messaging
ALTER TABLE public.chat_messages 
  DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey,
  ADD CONSTRAINT chat_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Comments
ALTER TABLE public.comments 
  DROP CONSTRAINT IF EXISTS comments_user_id_fkey,
  ADD CONSTRAINT comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Connections (social network)
ALTER TABLE public.connections 
  DROP CONSTRAINT IF EXISTS connections_user_id_1_fkey,
  ADD CONSTRAINT connections_user_id_1_fkey 
    FOREIGN KEY (user_id_1) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.connections 
  DROP CONSTRAINT IF EXISTS connections_user_id_2_fkey,
  ADD CONSTRAINT connections_user_id_2_fkey 
    FOREIGN KEY (user_id_2) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Content views
ALTER TABLE public.content_views 
  DROP CONSTRAINT IF EXISTS content_views_user_id_fkey,
  ADD CONSTRAINT content_views_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Insight-related tables
ALTER TABLE public.insight_comment_likes 
  DROP CONSTRAINT IF EXISTS insight_comment_likes_user_id_fkey,
  ADD CONSTRAINT insight_comment_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.insight_comments 
  DROP CONSTRAINT IF EXISTS insight_comments_user_id_fkey,
  ADD CONSTRAINT insight_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.insight_likes 
  DROP CONSTRAINT IF EXISTS insight_likes_user_id_fkey,
  ADD CONSTRAINT insight_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.insight_responses 
  DROP CONSTRAINT IF EXISTS insight_responses_responder_id_fkey,
  ADD CONSTRAINT insight_responses_responder_id_fkey 
    FOREIGN KEY (responder_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.insight_responses 
  DROP CONSTRAINT IF EXISTS insight_responses_original_author_id_fkey,
  ADD CONSTRAINT insight_responses_original_author_id_fkey 
    FOREIGN KEY (original_author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.insight_saves 
  DROP CONSTRAINT IF EXISTS insight_saves_user_id_fkey,
  ADD CONSTRAINT insight_saves_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.insight_views 
  DROP CONSTRAINT IF EXISTS insight_views_user_id_fkey,
  ADD CONSTRAINT insight_views_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.insights 
  DROP CONSTRAINT IF EXISTS insights_author_id_fkey,
  ADD CONSTRAINT insights_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Learning and analytics
ALTER TABLE public.learning_sessions 
  DROP CONSTRAINT IF EXISTS learning_sessions_user_id_fkey,
  ADD CONSTRAINT learning_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Paper-related tables
ALTER TABLE public.paper_comment_likes 
  DROP CONSTRAINT IF EXISTS paper_comment_likes_user_id_fkey,
  ADD CONSTRAINT paper_comment_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.paper_comments 
  DROP CONSTRAINT IF EXISTS paper_comments_user_id_fkey,
  ADD CONSTRAINT paper_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.paper_likes 
  DROP CONSTRAINT IF EXISTS paper_likes_user_id_fkey,
  ADD CONSTRAINT paper_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.paper_saves 
  DROP CONSTRAINT IF EXISTS paper_saves_user_id_fkey,
  ADD CONSTRAINT paper_saves_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.paper_views 
  DROP CONSTRAINT IF EXISTS paper_views_user_id_fkey,
  ADD CONSTRAINT paper_views_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Profile sections
ALTER TABLE public.profile_sections 
  DROP CONSTRAINT IF EXISTS profile_sections_user_id_fkey,
  ADD CONSTRAINT profile_sections_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Quiz system
ALTER TABLE public.quiz_attempts 
  DROP CONSTRAINT IF EXISTS quiz_attempts_user_id_fkey,
  ADD CONSTRAINT quiz_attempts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Reels/content creation
ALTER TABLE public.reels 
  DROP CONSTRAINT IF EXISTS reels_user_id_fkey,
  ADD CONSTRAINT reels_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Search analytics
ALTER TABLE public.search_analytics 
  DROP CONSTRAINT IF EXISTS search_analytics_user_id_fkey,
  ADD CONSTRAINT search_analytics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- User achievement system
ALTER TABLE public.user_achievement_progress 
  DROP CONSTRAINT IF EXISTS user_achievement_progress_user_id_fkey,
  ADD CONSTRAINT user_achievement_progress_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_achievements 
  DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey,
  ADD CONSTRAINT user_achievements_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- User professional profile data
ALTER TABLE public.user_certifications 
  DROP CONSTRAINT IF EXISTS user_certifications_user_id_fkey,
  ADD CONSTRAINT user_certifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_content_interactions 
  DROP CONSTRAINT IF EXISTS user_content_interactions_user_id_fkey,
  ADD CONSTRAINT user_content_interactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_daily_activities 
  DROP CONSTRAINT IF EXISTS user_daily_activities_user_id_fkey,
  ADD CONSTRAINT user_daily_activities_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_education 
  DROP CONSTRAINT IF EXISTS user_education_user_id_fkey,
  ADD CONSTRAINT user_education_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_experiences 
  DROP CONSTRAINT IF EXISTS user_experiences_user_id_fkey,
  ADD CONSTRAINT user_experiences_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_goal_companies 
  DROP CONSTRAINT IF EXISTS user_goal_companies_user_id_fkey,
  ADD CONSTRAINT user_goal_companies_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_goals 
  DROP CONSTRAINT IF EXISTS user_goals_user_id_fkey,
  ADD CONSTRAINT user_goals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_industries 
  DROP CONSTRAINT IF EXISTS user_industries_user_id_fkey,
  ADD CONSTRAINT user_industries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_languages 
  DROP CONSTRAINT IF EXISTS user_languages_user_id_fkey,
  ADD CONSTRAINT user_languages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_learning_analytics 
  DROP CONSTRAINT IF EXISTS user_learning_analytics_user_id_fkey,
  ADD CONSTRAINT user_learning_analytics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_learning_goals 
  DROP CONSTRAINT IF EXISTS user_learning_goals_user_id_fkey,
  ADD CONSTRAINT user_learning_goals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_projects 
  DROP CONSTRAINT IF EXISTS user_projects_user_id_fkey,
  ADD CONSTRAINT user_projects_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_publications 
  DROP CONSTRAINT IF EXISTS user_publications_user_id_fkey,
  ADD CONSTRAINT user_publications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Note: user_skill_endorsements has endorsed_by_user_id which should also cascade
ALTER TABLE public.user_skill_endorsements 
  DROP CONSTRAINT IF EXISTS user_skill_endorsements_endorsed_by_user_id_fkey,
  ADD CONSTRAINT user_skill_endorsements_endorsed_by_user_id_fkey 
    FOREIGN KEY (endorsed_by_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_skills 
  DROP CONSTRAINT IF EXISTS user_skills_user_id_fkey,
  ADD CONSTRAINT user_skills_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_streaks 
  DROP CONSTRAINT IF EXISTS user_streaks_user_id_fkey,
  ADD CONSTRAINT user_streaks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- XP/points system
ALTER TABLE public.xp_ledger 
  DROP CONSTRAINT IF EXISTS xp_ledger_user_id_fkey,
  ADD CONSTRAINT xp_ledger_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMIT;

-- Summary of changes:
-- This script adds ON DELETE CASCADE to 46+ foreign key constraints that reference profiles(id)
-- When a profile is deleted, all related data will be automatically deleted:
-- - All likes, saves, views, and comments across articles, books, papers, insights
-- - All learning sessions, achievements, and progress tracking
-- - All professional profile data (education, experience, skills, projects)
-- - All social connections and chat messages
-- - All analytics and tracking data
-- - All goals, streaks, and preferences

-- This ensures clean profile deletion without foreign key constraint violations
-- while maintaining data integrity within the remaining dataset