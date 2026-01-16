-- Create communities table
CREATE TABLE IF NOT EXISTS public.communities (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    avatar_url text,
    banner_url text,
    slug text UNIQUE,
    privacy_level text CHECK (privacy_level IN ('public', 'private', 'secret')) DEFAULT 'public',
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT communities_pkey PRIMARY KEY (id)
);

-- Create community_members table
CREATE TABLE IF NOT EXISTS public.community_members (
    community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text CHECK (role IN ('admin', 'moderator', 'member')) DEFAULT 'member',
    joined_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_members_pkey PRIMARY KEY (community_id, user_id)
);

-- Create community_posts table (Rich Content)
CREATE TABLE IF NOT EXISTS public.community_posts (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text,
    content text,
    media_urls text[], -- Array of image/video URLs
    linked_insight_id uuid, -- Optional reference to an insight
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_posts_pkey PRIMARY KEY (id)
);

-- Create community_messages table (Chat)
CREATE TABLE IF NOT EXISTS public.community_messages (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    reply_to_id uuid REFERENCES public.community_messages(id),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_messages_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Communities: Everyone can view public communities. Members can view private ones.
CREATE POLICY "Communities are viewable by everyone if public" 
ON public.communities FOR SELECT 
USING (privacy_level = 'public' OR 
       EXISTS (SELECT 1 FROM public.community_members WHERE community_id = communities.id AND user_id = auth.uid()));

-- Members: Everyone can view members of communities they can see.
CREATE POLICY "Community members are viewable by community viewers"
ON public.community_members FOR SELECT
USING (EXISTS (SELECT 1 FROM public.communities WHERE id = community_members.community_id));

-- Posts: Viewable by members (or everyone if public community)
CREATE POLICY "Posts viewable by community members"
ON public.community_posts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.communities c
        LEFT JOIN public.community_members m ON m.community_id = c.id AND m.user_id = auth.uid()
        WHERE c.id = community_posts.community_id AND (c.privacy_level = 'public' OR m.user_id IS NOT NULL)
    )
);

-- Messages: Viewable by members only (usually chat is member-only even in public groups? Let's assume yes)
CREATE POLICY "Messages viewable by community members"
ON public.community_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.community_members WHERE community_id = community_messages.community_id AND user_id = auth.uid()
    )
);

-- Writes (Simplified for MVP): Members can post/message.
CREATE POLICY "Members can insert posts"
ON public.community_posts FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = community_posts.community_id AND user_id = auth.uid())
);

CREATE POLICY "Members can insert messages"
ON public.community_messages FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = community_messages.community_id AND user_id = auth.uid())
);

-- RPC Function to get Unified Feed
-- Merges posts and messages, returning a unified structure.

CREATE OR REPLACE FUNCTION get_community_feed(
    target_community_id uuid,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    type text,
    content text,
    title text,
    media_urls text[],
    user_id uuid,
    created_at timestamp with time zone,
    author_name text,
    author_avatar text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    (
        -- Get Posts
        SELECT 
            p.id,
            'post' as type,
            p.content,
            p.title,
            p.media_urls,
            p.user_id,
            p.created_at,
            pr.full_name as author_name,
            pr.avatar_url as author_avatar
        FROM public.community_posts p
        JOIN public.profiles pr ON p.user_id = pr.id
        WHERE p.community_id = target_community_id
    )
    UNION ALL
    (
        -- Get Messages
        SELECT 
            m.id,
            'message' as type,
            m.content,
            NULL as title,
            NULL as media_urls,
            m.user_id,
            m.created_at,
            pr.full_name as author_name,
            pr.avatar_url as author_avatar
        FROM public.community_messages m
        JOIN public.profiles pr ON m.user_id = pr.id
        WHERE m.community_id = target_community_id
    )
    ORDER BY created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$;
