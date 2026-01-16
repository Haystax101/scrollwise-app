-- Migration: Add Title and Image URL to Insights
-- Run this in Supabase SQL Editor

ALTER TABLE public.insights
ADD COLUMN IF NOT EXISTS title text DEFAULT 'Untitled Insight',
ADD COLUMN IF NOT EXISTS image_url text;

-- Ensure RLS allows insert for authenticated users
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create insights"
ON public.insights
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can view all insights"
ON public.insights
FOR SELECT
TO authenticated
USING (true);

-- Allow updates for own insights
CREATE POLICY "Users can update own insights"
ON public.insights
FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);
