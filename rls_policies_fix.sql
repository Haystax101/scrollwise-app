-- RLS Policies for insight_comments table
-- This fixes the RLS issues preventing comment operations

-- Enable RLS on insight_comments table
ALTER TABLE public.insight_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all comments
CREATE POLICY "Users can read all insight comments"
ON public.insight_comments
FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can insert their own comments
CREATE POLICY "Users can insert their own insight comments"
ON public.insight_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own insight comments"
ON public.insight_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own insight comments"
ON public.insight_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Also fix insight_comment_likes table
ALTER TABLE public.insight_comment_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all comment likes
CREATE POLICY "Users can read all insight comment likes"
ON public.insight_comment_likes
FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can manage their own comment likes
CREATE POLICY "Users can manage their own insight comment likes"
ON public.insight_comment_likes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions for RPC functions
GRANT EXECUTE ON FUNCTION add_comment_reply(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_threaded_comments(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_insight_comment_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION update_insight_comment_likes_count() TO authenticated;