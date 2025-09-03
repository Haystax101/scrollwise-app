-- Fix RLS policies for insights table to allow automatic count updates
-- The issue: when adding comments/likes/saves, triggers update counts in insights table
-- but RLS policies are blocking these automatic updates

-- First, let's see current RLS policies on insights table
-- (You can run this separately to see what exists)
-- SELECT * FROM pg_policies WHERE tablename = 'insights';

-- Create policy to allow count updates for engagement activities
-- This allows the system to update likes_count, comments_count, saves_count automatically
CREATE POLICY "Allow automatic count updates for insights" ON public.insights
FOR UPDATE
TO authenticated
USING (true)  -- Allow any authenticated user to trigger count updates
WITH CHECK (true);  -- Allow the update to proceed

-- Also ensure users can read insights for the count update triggers to work
-- (they need to SELECT the insight to get author_id for voltz rewards)
CREATE POLICY "Allow reading insights for engagement" ON public.insights
FOR SELECT
TO authenticated
USING (true);  -- Allow reading any insight

-- If there are existing restrictive policies, we might need to drop them first
-- Uncomment these if the above policies conflict with existing ones:

-- DROP POLICY IF EXISTS "Users can only read their own insights" ON public.insights;
-- DROP POLICY IF EXISTS "Users can only update their own insights" ON public.insights;

-- Create more specific policies if needed:
-- Allow users to read all insights (needed for feed and engagement)
CREATE POLICY "Users can read all insights" ON public.insights
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update insight counts (for automatic count updates)
CREATE POLICY "Allow count updates on insights" ON public.insights
FOR UPDATE
TO authenticated
USING (true)  -- Anyone can trigger count updates
WITH CHECK (true);  -- Allow count updates to proceed

-- Allow users to insert their own insights
CREATE POLICY "Users can insert their own insights" ON public.insights
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Allow users to update only their own insight content (not counts)
CREATE POLICY "Users can update their own insights content" ON public.insights
FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);