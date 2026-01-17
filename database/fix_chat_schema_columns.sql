-- Fix Chat Schema Columns
-- The previous script used IF NOT EXISTS, so if the table existed (it did), it didn't add the new columns.

-- 1. Modify 'chats' table
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_group boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS name text;

-- 2. Modify 'chat_messages' table (if needed)
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS is_system_message boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS media_url text;

-- 3. Ensure policies are correct (Drop to be safe and recreate if needed, or just leave them if the create script handled them)
-- Re-running the policy creation parts of refine_chat_schema.sql is usually safe if we explicitly drop first or use DO blocks, 
-- but simpler to just ensure columns are there first.

-- 4. Re-run the RPCs just in case they failed compilation due to missing columns previously.
-- (The user might need to re-run the previous script OR we can include the RPCs here too)

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
        -- Partner Info
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
