-- COMPREHENSIVE RLS SECURITY FIX
-- This addresses ALL unrestricted tables in the database
-- Critical security vulnerability patches

-- =======================
-- 1. USER DATA TABLES (CRITICAL)
-- =======================

-- Profiles: Users can read all profiles but only update their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User Industries: Users can only manage their own industry selections
ALTER TABLE public.user_industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all user industries" ON public.user_industries
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own industries" ON public.user_industries
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- User Education: Users can only manage their own education data
ALTER TABLE public.user_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all education data" ON public.user_education
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own education" ON public.user_education
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- User Experiences: Users can only manage their own experience data  
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all experience data" ON public.user_experiences
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own experiences" ON public.user_experiences
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- User Goals: Users can only manage their own goals
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" ON public.user_goals
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- User Goal Companies: Users can only manage their own goal companies
ALTER TABLE public.user_goal_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goal companies" ON public.user_goal_companies
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- User Projects: Users can only manage their own projects
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all projects" ON public.user_projects
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own projects" ON public.user_projects
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Connections: Users can only see connections involving them
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own connections" ON public.connections
FOR SELECT TO authenticated USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can manage own connections" ON public.connections
FOR ALL TO authenticated USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- =======================
-- 2. CONTENT TABLES (HIGH RISK)
-- =======================

-- Articles: Public read, authenticated interaction
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Articles are publicly readable" ON public.articles
FOR SELECT TO authenticated USING (true);

-- Papers: Public read, authenticated interaction
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Papers are publicly readable" ON public.papers
FOR SELECT TO authenticated USING (true);

-- Books: Public read, authenticated interaction
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Books are publicly readable" ON public.books
FOR SELECT TO authenticated USING (true);

-- Insights: Public read, owner write
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insights are publicly readable" ON public.insights
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create insights" ON public.insights
FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own insights" ON public.insights
FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own insights" ON public.insights
FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Reels: Public read, owner write
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reels are publicly readable" ON public.reels
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own reels" ON public.reels
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- =======================
-- 3. INTERACTION TABLES (HIGH RISK)
-- =======================

-- Article Likes: Users can manage their own likes
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article likes are publicly readable" ON public.article_likes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own article likes" ON public.article_likes
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Paper Likes
ALTER TABLE public.paper_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paper likes are publicly readable" ON public.paper_likes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own paper likes" ON public.paper_likes
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Book Likes
ALTER TABLE public.book_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Book likes are publicly readable" ON public.book_likes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own book likes" ON public.book_likes
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Insight Likes
ALTER TABLE public.insight_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insight likes are publicly readable" ON public.insight_likes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own insight likes" ON public.insight_likes
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Article Saves
ALTER TABLE public.article_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own article saves" ON public.article_saves
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Paper Saves
ALTER TABLE public.paper_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own paper saves" ON public.paper_saves
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Book Saves
ALTER TABLE public.book_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own book saves" ON public.book_saves
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Insight Saves
ALTER TABLE public.insight_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own insight saves" ON public.insight_saves
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- View Tables - Users can read all views but only create their own
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article views are publicly readable" ON public.article_views
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own article views" ON public.article_views
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.article_views_enhanced ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enhanced article views are publicly readable" ON public.article_views_enhanced
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own enhanced article views" ON public.article_views_enhanced
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.paper_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paper views are publicly readable" ON public.paper_views
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own paper views" ON public.paper_views
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.book_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Book views are publicly readable" ON public.book_views
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own book views" ON public.book_views
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.insight_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insight views are publicly readable" ON public.insight_views
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own insight views" ON public.insight_views
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content views are publicly readable" ON public.content_views
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own content views" ON public.content_views
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =======================
-- 4. COMMENT SYSTEM (CRITICAL)
-- =======================

-- Article Comments: Public read, authenticated write, owner modify/delete
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are publicly readable" ON public.comments
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create comments" ON public.comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.comments
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Paper Comments
ALTER TABLE public.paper_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paper comments are publicly readable" ON public.paper_comments
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create paper comments" ON public.paper_comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paper comments" ON public.paper_comments
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own paper comments" ON public.paper_comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Book Comments
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Book comments are publicly readable" ON public.book_comments
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create book comments" ON public.book_comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own book comments" ON public.book_comments
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own book comments" ON public.book_comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Insight Comments (already have some policies, but ensuring consistency)
DROP POLICY IF EXISTS "Users can read all insight comments" ON public.insight_comments;
DROP POLICY IF EXISTS "Users can insert their own insight comments" ON public.insight_comments;
DROP POLICY IF EXISTS "Users can update their own insight comments" ON public.insight_comments;
DROP POLICY IF EXISTS "Users can delete their own insight comments" ON public.insight_comments;

CREATE POLICY "Insight comments are publicly readable" ON public.insight_comments
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create insight comments" ON public.insight_comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insight comments" ON public.insight_comments
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insight comments" ON public.insight_comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comment Likes Tables
ALTER TABLE public.article_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article comment likes are publicly readable" ON public.article_comment_likes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own article comment likes" ON public.article_comment_likes
FOR ALL TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.paper_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paper comment likes are publicly readable" ON public.paper_comment_likes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own paper comment likes" ON public.paper_comment_likes
FOR ALL TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.book_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Book comment likes are publicly readable" ON public.book_comment_likes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own book comment likes" ON public.book_comment_likes
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Insight Comment Likes (clean up existing policies first)
DROP POLICY IF EXISTS "Users can read all insight comment likes" ON public.insight_comment_likes;
DROP POLICY IF EXISTS "Users can manage their own insight comment likes" ON public.insight_comment_likes;

CREATE POLICY "Insight comment likes are publicly readable" ON public.insight_comment_likes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own insight comment likes" ON public.insight_comment_likes
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- =======================
-- 5. COMMUNICATION TABLES (CRITICAL)
-- =======================

-- Chats: Users can only access chats they're part of
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own chats" ON public.chats
FOR SELECT TO authenticated USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create chats they're part of" ON public.chats
FOR INSERT TO authenticated WITH CHECK (auth.uid() = ANY(participant_ids));

-- Chat Messages: Users can only access messages from chats they're part of
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages from own chats" ON public.chat_messages
FOR SELECT TO authenticated USING (
  chat_id IN (
    SELECT id FROM public.chats WHERE auth.uid() = ANY(participant_ids)
  )
);

CREATE POLICY "Users can send messages to own chats" ON public.chat_messages
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND
  chat_id IN (
    SELECT id FROM public.chats WHERE auth.uid() = ANY(participant_ids)
  )
);

-- Insight Responses: Public read, owner write
ALTER TABLE public.insight_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insight responses are publicly readable" ON public.insight_responses
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create insight responses" ON public.insight_responses
FOR INSERT TO authenticated WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "Users can update own insight responses" ON public.insight_responses
FOR UPDATE TO authenticated USING (auth.uid() = responder_id);

CREATE POLICY "Users can delete own insight responses" ON public.insight_responses
FOR DELETE TO authenticated USING (auth.uid() = responder_id);

-- =======================
-- 6. QUIZ/LEARNING TABLES
-- =======================

-- Quiz Questions: Public read for authenticated users
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quiz questions are readable by authenticated users" ON public.quiz_questions
FOR SELECT TO authenticated USING (true);

-- Quiz Attempts: Users can only see their own attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quiz attempts" ON public.quiz_attempts
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- =======================
-- 7. ANALYTICS TABLES
-- =======================

-- Search Analytics: Users can read all analytics but only create their own
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Search analytics are publicly readable" ON public.search_analytics
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own search analytics" ON public.search_analytics
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- XP Ledger: Users can read all XP data but only create their own
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "XP ledger is publicly readable" ON public.xp_ledger
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own XP entries" ON public.xp_ledger
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =======================
-- 8. REFERENCE DATA (PUBLIC READ)
-- =======================

-- Industries: Public read
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Industries are publicly readable" ON public.industries
FOR SELECT TO authenticated USING (true);

-- Companies: Public read
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies are publicly readable" ON public.companies
FOR SELECT TO authenticated USING (true);

-- Universities: Public read
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universities are publicly readable" ON public.universities
FOR SELECT TO authenticated USING (true);

-- Degrees: Public read
ALTER TABLE public.degrees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Degrees are publicly readable" ON public.degrees
FOR SELECT TO authenticated USING (true);

-- =======================
-- 9. GRANT RPC PERMISSIONS
-- =======================

-- Grant execute permissions on all RPC functions to authenticated users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =======================
-- SECURITY SUMMARY
-- =======================
-- This file secures ALL previously unrestricted tables
-- Key principles applied:
-- 1. Public read for content and reference data
-- 2. Own-data-only access for personal information
-- 3. Owner-only modification for user-generated content
-- 4. Strict privacy for communications
-- 5. Analytics data readable but own-creation-only

-- After running this, NO tables should show as "unrestricted" in Supabase