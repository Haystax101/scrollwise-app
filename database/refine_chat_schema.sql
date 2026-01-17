-- Refine Chat Schema for Direct Messaging (1-on-1 and Groups)

-- 1. Upgrade/Recreate 'chats' table
-- We'll add 'last_message_at' for sorting and 'updated_at'.
CREATE TABLE IF NOT EXISTS public.chats (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_message_at timestamp with time zone DEFAULT now(),
    is_group boolean DEFAULT false,
    name text, -- Optional for group chats
    CONSTRAINT chats_pkey PRIMARY KEY (id)
);

-- 2. Create 'chat_participants' Junction Table (The "Professional" approach)
-- This replaces the fragile 'participant_ids' array.
CREATE TABLE IF NOT EXISTS public.chat_participants (
    chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at timestamp with time zone DEFAULT now(),
    last_read_at timestamp with time zone DEFAULT now(), -- Vital for unread counts
    CONSTRAINT chat_participants_pkey PRIMARY KEY (chat_id, user_id)
);

-- 3. Upgrade/Recreate 'chat_messages' table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_system_message boolean DEFAULT false, -- For "X joined the chat"
    media_url text, -- Support images in DMs too
    CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Security First)

-- Chat Participants: Viewable by self.
CREATE POLICY "Users can view their own participant rows"
ON public.chat_participants FOR SELECT
USING (user_id = auth.uid());

-- Chats: Viewable if you are a participant.
CREATE POLICY "Users can view chats they are in"
ON public.chats FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants cp 
        WHERE cp.chat_id = id AND cp.user_id = auth.uid()
    )
);

-- Messages: Viewable if you are a participant of the chat.
CREATE POLICY "Users can view messages in their chats"
ON public.chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants cp 
        WHERE cp.chat_id = chat_messages.chat_id AND cp.user_id = auth.uid()
    )
);

-- Messages: Insertable if you are a participant.
CREATE POLICY "Users can send messages to their chats"
ON public.chat_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chat_participants cp 
        WHERE cp.chat_id = chat_messages.chat_id AND cp.user_id = auth.uid()
    )
);

-- 4. RPC: Get My Chats (Inbox)
-- Returns rich preview: Partner Name, Avatar, Last Message, Unread Count
CREATE OR REPLACE FUNCTION get_my_chats()
RETURNS TABLE (
    chat_id uuid,
    updated_at timestamp with time zone,
    last_message_content text,
    last_message_at timestamp with time zone,
    unread_count bigint,
    partner_id uuid,
    partner_name text,
    partner_avatar text,
    is_group boolean,
    group_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as chat_id,
        c.updated_at,
        (SELECT content FROM public.chat_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
        c.last_message_at,
        (
            SELECT COUNT(*) 
            FROM public.chat_messages m 
            WHERE m.chat_id = c.id 
            AND m.created_at > cp_me.last_read_at
        ) as unread_count,
        -- Partner Info (Logic: Find the 'other' participant. If group, this might be null or specific logic)
        (
            SELECT p.id 
            FROM public.chat_participants cp_other
            JOIN public.profiles p ON cp_other.user_id = p.id
            WHERE cp_other.chat_id = c.id AND cp_other.user_id != auth.uid()
            LIMIT 1
        ) as partner_id,
        (
            SELECT p.full_name 
            FROM public.chat_participants cp_other
            JOIN public.profiles p ON cp_other.user_id = p.id
            WHERE cp_other.chat_id = c.id AND cp_other.user_id != auth.uid()
            LIMIT 1
        ) as partner_name,
        (
            SELECT p.avatar_url
            FROM public.chat_participants cp_other
            JOIN public.profiles p ON cp_other.user_id = p.id
            WHERE cp_other.chat_id = c.id AND cp_other.user_id != auth.uid()
            LIMIT 1
        ) as partner_avatar,
        c.is_group,
        c.name as group_name
    FROM public.chats c
    JOIN public.chat_participants cp_me ON c.id = cp_me.chat_id
    WHERE cp_me.user_id = auth.uid()
    ORDER BY c.last_message_at DESC;
END;
$$;

-- 5. RPC: Get or Create Direct Chat
-- Ensures we don't create duplicate 1-on-1 chats.
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(partner_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_chat_id uuid;
    new_chat_id uuid;
BEGIN
    -- 1. Check if a 1-on-1 chat already exists between these two users
    SELECT c.id INTO existing_chat_id
    FROM public.chats c
    JOIN public.chat_participants cp1 ON c.id = cp1.chat_id
    JOIN public.chat_participants cp2 ON c.id = cp2.chat_id
    WHERE c.is_group = false
    AND cp1.user_id = auth.uid()
    AND cp2.user_id = partner_id;

    -- 2. If found, return it
    IF existing_chat_id IS NOT NULL THEN
        RETURN existing_chat_id;
    END IF;

    -- 3. If not, create new chat
    INSERT INTO public.chats (is_group) VALUES (false) RETURNING id INTO new_chat_id;

    -- 4. Add participants
    INSERT INTO public.chat_participants (chat_id, user_id) VALUES (new_chat_id, auth.uid());
    INSERT INTO public.chat_participants (chat_id, user_id) VALUES (new_chat_id, partner_id);

    RETURN new_chat_id;
END;
$$;

-- 6. RPC: Send Message (Updates last_message_at automatically)
CREATE OR REPLACE FUNCTION send_direct_message(
    p_chat_id uuid,
    p_content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_message_id uuid;
BEGIN
    -- Insert message
    INSERT INTO public.chat_messages (chat_id, sender_id, content)
    VALUES (p_chat_id, auth.uid(), p_content)
    RETURNING id INTO new_message_id;

    -- Update chat timestamp
    UPDATE public.chats 
    SET last_message_at = now(), updated_at = now()
    WHERE id = p_chat_id;

    RETURN new_message_id;
END;
$$;

-- 7. RPC: Mark Chat as Read
CREATE OR REPLACE FUNCTION mark_chat_read(p_chat_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.chat_participants
    SET last_read_at = now()
    WHERE chat_id = p_chat_id AND user_id = auth.uid();
END;
$$;
