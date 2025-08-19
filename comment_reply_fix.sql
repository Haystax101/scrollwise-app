-- Fix for comment reply issues
-- This ensures the RPC functions work properly with RLS policies

-- 1. Update the add_comment_reply function to be more RLS-compatible
CREATE OR REPLACE FUNCTION add_comment_reply(
  p_user_id uuid,
  p_insight_id uuid,
  p_parent_comment_id uuid,
  p_content text
) RETURNS uuid AS $$
DECLARE
  parent_depth integer;
  new_comment_id uuid;
BEGIN
  -- Security check: Ensure the calling user matches p_user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: User ID mismatch';
  END IF;
  
  -- Validate that parent comment exists and get its depth
  SELECT depth_level INTO parent_depth 
  FROM public.insight_comments 
  WHERE id = p_parent_comment_id;
  
  -- Check if parent comment was found
  IF parent_depth IS NULL THEN
    RAISE EXCEPTION 'Parent comment not found or access denied';
  END IF;
  
  -- Limit depth to 3 levels (like Instagram/TikTok)
  IF parent_depth >= 3 THEN
    RAISE EXCEPTION 'Maximum reply depth exceeded';
  END IF;
  
  -- Validate that the insight exists and is accessible
  IF NOT EXISTS (
    SELECT 1 FROM public.insights WHERE id = p_insight_id
  ) THEN
    RAISE EXCEPTION 'Insight not found or access denied';
  END IF;
  
  -- Insert new reply
  INSERT INTO public.insight_comments (user_id, insight_id, parent_comment_id, content, depth_level)
  VALUES (p_user_id, p_insight_id, p_parent_comment_id, p_content, parent_depth + 1)
  RETURNING id INTO new_comment_id;
  
  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the get_threaded_comments function to be more RLS-compatible
CREATE OR REPLACE FUNCTION get_threaded_comments(p_insight_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  insight_id uuid,
  parent_comment_id uuid,
  content text,
  created_at timestamp with time zone,
  likes_count bigint,
  reply_count bigint,
  depth_level integer,
  user_name text,
  user_avatar text
) AS $$
BEGIN
  -- Validate that the insight exists and is accessible
  IF NOT EXISTS (
    SELECT 1 FROM public.insights WHERE insights.id = p_insight_id
  ) THEN
    RAISE EXCEPTION 'Insight not found or access denied';
  END IF;

  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- Get root comments (depth 0)
    SELECT 
      c.id, c.user_id, c.insight_id, c.parent_comment_id, c.content, c.created_at, 
      c.likes_count, c.reply_count, c.depth_level,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      c.created_at as sort_date
    FROM public.insight_comments c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.insight_id = p_insight_id AND c.parent_comment_id IS NULL
    
    UNION ALL
    
    -- Get replies (depth > 0)
    SELECT 
      c.id, c.user_id, c.insight_id, c.parent_comment_id, c.content, c.created_at,
      c.likes_count, c.reply_count, c.depth_level,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      ct.sort_date -- Maintain parent's sort order
    FROM public.insight_comments c
    JOIN public.profiles p ON c.user_id = p.id
    JOIN comment_tree ct ON c.parent_comment_id = ct.id
    WHERE c.depth_level <= 3 -- Limit depth to 3 levels like Instagram
  )
  SELECT ct.id, ct.user_id, ct.insight_id, ct.parent_comment_id, ct.content, ct.created_at,
         ct.likes_count, ct.reply_count, ct.depth_level, ct.user_name, ct.user_avatar
  FROM comment_tree ct
  ORDER BY ct.sort_date DESC, ct.depth_level ASC, ct.likes_count DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure proper permissions for the RPC functions
GRANT EXECUTE ON FUNCTION add_comment_reply(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_threaded_comments(uuid, integer, integer) TO authenticated;

-- 4. Create a simpler comment insertion function as a backup
CREATE OR REPLACE FUNCTION insert_insight_comment(
  p_insight_id uuid,
  p_content text,
  p_parent_comment_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  new_comment_id uuid;
  parent_depth integer DEFAULT 0;
BEGIN
  -- Security check: Only authenticated users can insert comments
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- If this is a reply, get parent depth and validate
  IF p_parent_comment_id IS NOT NULL THEN
    SELECT depth_level INTO parent_depth 
    FROM public.insight_comments 
    WHERE id = p_parent_comment_id;
    
    IF parent_depth IS NULL THEN
      RAISE EXCEPTION 'Parent comment not found';
    END IF;
    
    IF parent_depth >= 3 THEN
      RAISE EXCEPTION 'Maximum reply depth exceeded';
    END IF;
    
    parent_depth := parent_depth + 1;
  END IF;
  
  -- Insert the comment
  INSERT INTO public.insight_comments (
    user_id, 
    insight_id, 
    content, 
    parent_comment_id, 
    depth_level
  )
  VALUES (
    auth.uid(), 
    p_insight_id, 
    p_content, 
    p_parent_comment_id, 
    parent_depth
  )
  RETURNING id INTO new_comment_id;
  
  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION insert_insight_comment(uuid, text, uuid) TO authenticated;