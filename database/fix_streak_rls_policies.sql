-- Fix RLS Policies for Streak Tables
-- This addresses the app crashes during onboarding

-- Enable RLS on streak tables
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_streaks table
-- Users can only access their own streak data
CREATE POLICY "Users can view their own streaks"
  ON public.user_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON public.user_streaks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.user_streaks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks"
  ON public.user_streaks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for user_daily_activities table
-- Users can only access their own activity data
CREATE POLICY "Users can view their own daily activities"
  ON public.user_daily_activities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily activities"
  ON public.user_daily_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily activities"
  ON public.user_daily_activities
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily activities"
  ON public.user_daily_activities
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT
  'RLS POLICIES CREATED' as status,
  'Check the results below' as message;

-- Show policies for user_streaks
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_streaks'
ORDER BY policyname;

-- Show policies for user_daily_activities
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_daily_activities'
ORDER BY policyname;

SELECT
  '✅ RLS POLICIES DEPLOYED!' as final_status,
  'App onboarding should now work without crashes' as result;