-- Create Follows Schema
-- Run this in Supabase SQL Editor

-- 1. Create Table: follows
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT follows_pkey PRIMARY KEY (follower_id, following_id),
    CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT follows_self_check CHECK (follower_id <> following_id)
);

-- 2. Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Public read access"
ON public.follows
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can follow others"
ON public.follows
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
ON public.follows
FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- 4. RPCs

-- Get Follow Counts
CREATE OR REPLACE FUNCTION public.get_follow_counts(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    followers_count integer;
    following_count integer;
BEGIN
    SELECT count(*) INTO followers_count FROM public.follows WHERE following_id = target_user_id;
    SELECT count(*) INTO following_count FROM public.follows WHERE follower_id = target_user_id;
    
    RETURN json_build_object(
        'followers', followers_count,
        'following', following_count
    );
END;
$$;

-- Check if following
CREATE OR REPLACE FUNCTION public.is_following(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.follows 
        WHERE follower_id = auth.uid() 
        AND following_id = target_user_id
    );
END;
$$;

-- Get Followers List (with profile info)
CREATE OR REPLACE FUNCTION public.get_followers(target_user_id uuid)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    avatar_url text,
    is_following_viewer boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.full_name,
        p.avatar_url,
        EXISTS (
            SELECT 1 FROM public.follows f2 
            WHERE f2.follower_id = auth.uid() 
            AND f2.following_id = p.id
        ) as is_following_viewer
    FROM public.follows f
    JOIN public.profiles p ON f.follower_id = p.id
    WHERE f.following_id = target_user_id;
END;
$$;

-- Get Following List (with profile info)
CREATE OR REPLACE FUNCTION public.get_following(target_user_id uuid)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    avatar_url text,
    is_following_viewer boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.full_name,
        p.avatar_url,
        EXISTS (
            SELECT 1 FROM public.follows f2 
            WHERE f2.follower_id = auth.uid() 
            AND f2.following_id = p.id
        ) as is_following_viewer
    FROM public.follows f
    JOIN public.profiles p ON f.following_id = p.id
    WHERE f.follower_id = target_user_id;
END;
$$;
