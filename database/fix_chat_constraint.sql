-- Fix Chat Constraint (Legacy participant_ids)

-- The old schema enforced 'participant_ids' to be NOT NULL.
-- Our new schema uses 'chat_participants' table instead.
-- We must make the old column nullable (or drop it) to allow creating new chats.

ALTER TABLE public.chats 
ALTER COLUMN participant_ids DROP NOT NULL;

-- Optional: Drop the column entirely if you are sure you don't need the old array data anymore.
-- ALTER TABLE public.chats DROP COLUMN participant_ids;

-- Also ensuring the RPC 'get_or_create_direct_chat' is definitely strictly correct for the new schema.
-- (The previous definition was correct, but the table constraint blocked it).
