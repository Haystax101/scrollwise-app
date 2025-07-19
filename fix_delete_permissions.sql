-- fix_delete_permissions.sql

-- Add DELETE policy for insights
DROP POLICY IF EXISTS "Users can delete their own insights" ON insights;
CREATE POLICY "Users can delete their own insights" ON insights
FOR DELETE USING (auth.uid() = author_id);

-- Add DELETE policy for insight_responses
DROP POLICY IF EXISTS "Users can delete responses to their own insights" ON insight_responses;
CREATE POLICY "Users can delete responses to their own insights" ON insight_responses
FOR DELETE USING (auth.uid() = original_author_id);
