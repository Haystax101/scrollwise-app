-- Database changes for Part 10: Simplified Profile Sections
-- Create table for passionate about and working on sections

CREATE TABLE public.profile_passions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  passionate_about text CHECK (length(passionate_about) <= 400),
  working_on text CHECK (length(working_on) <= 400),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_passions_pkey PRIMARY KEY (id),
  CONSTRAINT profile_passions_user_id_key UNIQUE (user_id),
  CONSTRAINT profile_passions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Add RLS policies for profile_passions table
ALTER TABLE public.profile_passions ENABLE ROW LEVEL SECURITY;

-- Users can only view and modify their own profile passions
CREATE POLICY "Users can view their own profile passions" ON public.profile_passions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile passions" ON public.profile_passions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile passions" ON public.profile_passions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile passions" ON public.profile_passions
  FOR DELETE USING (auth.uid() = user_id);