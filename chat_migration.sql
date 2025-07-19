-- chat_migration.sql - V2 (Idempotent and handles migration)
-- This script can be run even if the previous version was already executed.

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS connections (
  user_id_1 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id_1, user_id_2)
);

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  participant_ids UUID[] NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure insight_responses table exists (it might have been created by the previous script)
CREATE TABLE IF NOT EXISTS insight_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  responder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  original_author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate the insight_responses.insight_id column
-- Drop the old column if it exists (it might be of the wrong type, INTEGER)
ALTER TABLE insight_responses DROP COLUMN IF EXISTS insight_id;
-- Add the new column with the correct type and foreign key
ALTER TABLE insight_responses ADD COLUMN insight_id UUID REFERENCES insights(id) ON DELETE CASCADE;


-- Enable RLS on all tables (idempotent)
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_responses ENABLE ROW LEVEL SECURITY;

-- Recreate RLS Policies to ensure they are up-to-date (using DROP IF EXISTS)
DROP POLICY IF EXISTS "Users can only see connections they are a part of" ON connections;
CREATE POLICY "Users can only see connections they are a part of" ON connections
FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

DROP POLICY IF EXISTS "Users can create their own connections" ON connections;
CREATE POLICY "Users can create their own connections" ON connections
FOR INSERT WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

DROP POLICY IF EXISTS "Users can only see chats they are a part of" ON chats;
CREATE POLICY "Users can only see chats they are a part of" ON chats
FOR SELECT USING (auth.uid() = ANY(participant_ids));

DROP POLICY IF EXISTS "Users can create chats they are a part of" ON chats;
CREATE POLICY "Users can create chats they are a part of" ON chats
FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

DROP POLICY IF EXISTS "Users can only see messages in their chats" ON chat_messages;
CREATE POLICY "Users can only see messages in their chats" ON chat_messages
FOR SELECT USING (chat_id IN (SELECT id FROM chats WHERE auth.uid() = ANY(participant_ids)));

DROP POLICY IF EXISTS "Insights are viewable by everyone" ON insights;
CREATE POLICY "Insights are viewable by everyone" ON insights
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own insights" ON insights;
CREATE POLICY "Users can create their own insights" ON insights
FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own insights" ON insights;
CREATE POLICY "Users can delete their own insights" ON insights
FOR DELETE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can only see responses to their own insights" ON insight_responses;
CREATE POLICY "Users can only see responses to their own insights" ON insight_responses
FOR SELECT USING (auth.uid() = original_author_id);

DROP POLICY IF EXISTS "Users can create responses to insights" ON insight_responses;
CREATE POLICY "Users can create responses to insights" ON insight_responses
FOR INSERT WITH CHECK (auth.uid() = responder_id);

DROP POLICY IF EXISTS "Users can delete responses to their own insights" ON insight_responses;
CREATE POLICY "Users can delete responses to their own insights" ON insight_responses
FOR DELETE USING (auth.uid() = original_author_id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_connections_user_id_1 ON connections(user_id_1);
CREATE INDEX IF NOT EXISTS idx_connections_user_id_2 ON connections(user_id_2);
CREATE INDEX IF NOT EXISTS idx_chats_participant_ids ON chats USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_insights_author_id ON insights(author_id);
CREATE INDEX IF NOT EXISTS idx_insight_responses_original_author_id ON insight_responses(original_author_id); 