-- fix_connections_policy.sql

-- Add INSERT policy for connections
DROP POLICY IF EXISTS "Users can create their own connections" ON connections;
CREATE POLICY "Users can create their own connections" ON connections
FOR INSERT WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
