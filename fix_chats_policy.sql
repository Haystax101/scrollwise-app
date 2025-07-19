-- fix_chats_policy.sql

-- Add INSERT policy for chats
DROP POLICY IF EXISTS "Users can create chats they are a part of" ON chats;
CREATE POLICY "Users can create chats they are a part of" ON chats
FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));
