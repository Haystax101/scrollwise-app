-- Fix toggle_content_flag RPC function to handle both BIGINT and UUID content_ids
-- The current function expects BIGINT but insights have UUID ids

-- Drop existing function
DROP FUNCTION IF EXISTS public.toggle_content_flag(UUID, BIGINT, TEXT);

-- Create new function that accepts TEXT for content_id (can handle both numeric and UUID strings)
CREATE OR REPLACE FUNCTION public.toggle_content_flag(
  p_user_id UUID,
  p_content_id TEXT,  -- Changed from BIGINT to TEXT to handle both numeric IDs and UUIDs
  p_content_type TEXT
)
RETURNS JSON AS $$
DECLARE
  flag_exists BOOLEAN;
  new_flag_count INTEGER;
  result JSON;
BEGIN
  -- Validate content type
  IF p_content_type NOT IN ('article', 'paper', 'book', 'insight') THEN
    RAISE EXCEPTION 'Invalid content type: %', p_content_type;
  END IF;

  -- Check if user has already flagged this content
  SELECT EXISTS (
    SELECT 1 FROM public.user_content_flags 
    WHERE user_id = p_user_id 
    AND content_type = p_content_type 
    AND content_id = p_content_id
  ) INTO flag_exists;

  IF flag_exists THEN
    -- User already flagged - remove flag (decrement count)
    DELETE FROM public.user_content_flags 
    WHERE user_id = p_user_id 
    AND content_type = p_content_type 
    AND content_id = p_content_id;

    -- Decrement flag count in content table
    CASE p_content_type
      WHEN 'article' THEN
        UPDATE public.articles 
        SET flag = GREATEST(0, COALESCE(flag, 0) - 1)
        WHERE id = p_content_id::BIGINT  -- Cast to bigint for numeric IDs
        RETURNING flag INTO new_flag_count;
      WHEN 'paper' THEN
        UPDATE public.papers 
        SET flag = GREATEST(0, COALESCE(flag, 0) - 1)
        WHERE id = p_content_id::BIGINT  -- Cast to bigint for numeric IDs
        RETURNING flag INTO new_flag_count;
      WHEN 'book' THEN
        UPDATE public.books 
        SET flag = GREATEST(0, COALESCE(flag, 0) - 1)
        WHERE id = p_content_id::BIGINT  -- Cast to bigint for numeric IDs
        RETURNING flag INTO new_flag_count;
      WHEN 'insight' THEN
        UPDATE public.insights 
        SET flag = GREATEST(0, COALESCE(flag, 0) - 1)
        WHERE id = p_content_id::UUID  -- Cast to UUID for insights
        RETURNING flag INTO new_flag_count;
    END CASE;

    result := json_build_object(
      'flagged', false,
      'flag_count', COALESCE(new_flag_count, 0),
      'action', 'removed'
    );

  ELSE
    -- User hasn't flagged - add flag (increment count)
    INSERT INTO public.user_content_flags (user_id, content_type, content_id)
    VALUES (p_user_id, p_content_type, p_content_id);

    -- Increment flag count in content table
    CASE p_content_type
      WHEN 'article' THEN
        UPDATE public.articles 
        SET flag = COALESCE(flag, 0) + 1
        WHERE id = p_content_id::BIGINT  -- Cast to bigint for numeric IDs
        RETURNING flag INTO new_flag_count;
      WHEN 'paper' THEN
        UPDATE public.papers 
        SET flag = COALESCE(flag, 0) + 1
        WHERE id = p_content_id::BIGINT  -- Cast to bigint for numeric IDs
        RETURNING flag INTO new_flag_count;
      WHEN 'book' THEN
        UPDATE public.books 
        SET flag = COALESCE(flag, 0) + 1
        WHERE id = p_content_id::BIGINT  -- Cast to bigint for numeric IDs
        RETURNING flag INTO new_flag_count;
      WHEN 'insight' THEN
        UPDATE public.insights 
        SET flag = COALESCE(flag, 0) + 1
        WHERE id = p_content_id::UUID  -- Cast to UUID for insights
        RETURNING flag INTO new_flag_count;
    END CASE;

    result := json_build_object(
      'flagged', true,
      'flag_count', COALESCE(new_flag_count, 1),
      'action', 'added'
    );

  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the updated function
GRANT EXECUTE ON FUNCTION public.toggle_content_flag(UUID, TEXT, TEXT) TO authenticated;