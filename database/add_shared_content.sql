-- Add shared_content column to chat_messages table
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS shared_content JSONB;

-- Drop existing function to update signature
DROP FUNCTION IF EXISTS send_direct_message;

-- Re-create the function with shared_content parameter
CREATE OR REPLACE FUNCTION send_direct_message(
    p_chat_id UUID,
    p_content TEXT,
    p_shared_content JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_message_id UUID;
    v_sender_id UUID;
BEGIN
    -- Get current user
    v_sender_id := auth.uid();

    -- Check if user is participant
    IF NOT EXISTS (
        SELECT 1 FROM chat_participants
        WHERE chat_id = p_chat_id AND user_id = v_sender_id
    ) THEN
        RAISE EXCEPTION 'User is not a participant of this chat';
    END IF;

    -- Insert message
    INSERT INTO chat_messages (chat_id, sender_id, content, shared_content)
    VALUES (p_chat_id, v_sender_id, p_content, p_shared_content)
    RETURNING id INTO v_message_id;

    -- Update chat updated_at
    UPDATE chats
    SET updated_at = NOW()
    WHERE id = p_chat_id;

    RETURN v_message_id;
END;
$$;
