-- This script adds Row Level Security (RLS) policies to your tables.
-- After running this, ensure that RLS is toggled ON for each table in your Supabase dashboard (Authentication -> Policies).

BEGIN;

-- ----------------------------------------
-- Canonical Tables (Public Read)
-- ----------------------------------------

-- Enable RLS and set policies for `industries`
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.industries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for service_role only" ON public.industries FOR INSERT TO service_role WITH CHECK (true);

-- Enable RLS and set policies for `companies`
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.companies FOR INSERT TO authenticated WITH CHECK (true); -- Allows users to add new companies

-- Enable RLS and set policies for `universities`
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.universities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.universities FOR INSERT TO authenticated WITH CHECK (true);

-- Enable RLS and set policies for `degrees`
ALTER TABLE public.degrees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.degrees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.degrees FOR INSERT TO authenticated WITH CHECK (true);

-- ----------------------------------------
-- Content Tables (Public Read)
-- ----------------------------------------

-- Enable RLS and set policies for `articles`
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.articles FOR SELECT TO authenticated USING (true);

-- Enable RLS and set policies for `reels`
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.reels FOR SELECT TO authenticated USING (true);

-- ----------------------------------------
-- User-Specific Tables (Owner Only)
-- ----------------------------------------

-- Enable RLS and set policies for `user_industries`
ALTER TABLE public.user_industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own data" ON public.user_industries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable RLS and set policies for `user_education`
ALTER TABLE public.user_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own data" ON public.user_education FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable RLS and set policies for `user_goals`
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own data" ON public.user_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable RLS and set policies for `user_experiences`
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own data" ON public.user_experiences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable RLS and set policies for `user_goal_companies`
ALTER TABLE public.user_goal_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own data" ON public.user_goal_companies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------
-- User Action Tables (Likes, Comments, etc.)
-- ----------------------------------------

-- Enable RLS and set policies for `article_likes`
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own likes" ON public.article_likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable RLS and set policies for `article_saves`
ALTER TABLE public.article_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own saves" ON public.article_saves FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable RLS and set policies for `article_views`
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own views" ON public.article_views FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable RLS and set policies for `comments`
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own comments" ON public.comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


COMMIT;