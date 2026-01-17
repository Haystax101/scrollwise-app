-- Functions to bypass RLS for policy checks (Breaks Recursion Loops)
CREATE OR REPLACE FUNCTION public.is_community_public(_community_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.communities 
    WHERE id = _community_id AND privacy_level = 'public'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_member(_community_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = _community_id AND user_id = _user_id
  );
$$;

-- Drop existing policies to replace them (Clean Slate)
DROP POLICY IF EXISTS "Communities are viewable by everyone if public" ON public.communities;
DROP POLICY IF EXISTS "Community members are viewable by community viewers" ON public.community_members;
DROP POLICY IF EXISTS "Posts viewable by community members" ON public.community_posts;
DROP POLICY IF EXISTS "Messages viewable by community members" ON public.community_messages;
DROP POLICY IF EXISTS "Members can insert posts" ON public.community_posts;
DROP POLICY IF EXISTS "Members can insert messages" ON public.community_messages;

-- New Policies using Helper Functions

-- Communities: Public OR Member
CREATE POLICY "Communities Policy" ON public.communities
FOR SELECT USING (
  privacy_level = 'public' 
  OR 
  public.is_community_member(id, auth.uid())
);

-- Members: Visible if community is public OR viewer is a member
CREATE POLICY "Members Policy" ON public.community_members
FOR SELECT USING (
  public.is_community_public(community_id)
  OR
  public.is_community_member(community_id, auth.uid())
);

-- Posts: Public Community OR Member
CREATE POLICY "Posts Select Policy" ON public.community_posts
FOR SELECT USING (
  public.is_community_public(community_id)
  OR
  public.is_community_member(community_id, auth.uid())
);

-- Messages: Public Community OR Member
CREATE POLICY "Messages Select Policy" ON public.community_messages
FOR SELECT USING (
  public.is_community_public(community_id)
  OR
  public.is_community_member(community_id, auth.uid())
);

-- Writes (Member Only)
CREATE POLICY "Posts Insert Policy" ON public.community_posts
FOR INSERT WITH CHECK (
  public.is_community_member(community_id, auth.uid())
);

CREATE POLICY "Messages Insert Policy" ON public.community_messages
FOR INSERT WITH CHECK (
  public.is_community_member(community_id, auth.uid())
);
