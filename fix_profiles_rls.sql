-- Fix missing RLS policies for profiles table
-- This allows users to create and update their own profile records

BEGIN;

-- Enable RLS for profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile (for onboarding)
CREATE POLICY IF NOT EXISTS "Allow users to insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY IF NOT EXISTS "Allow users to update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY IF NOT EXISTS "Allow users to read own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Allow reading other users' profiles for features like comments, etc.
CREATE POLICY IF NOT EXISTS "Allow reading other profiles for public data" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

COMMIT;