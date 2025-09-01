-- Flag System Implementation
-- Creates a comprehensive flag system with toggle functionality for content

-- 1. Create user_content_flags table to track which users flagged which content
CREATE TABLE IF NOT EXISTS public.user_content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'paper', 'book', 'insight')),
  content_id BIGINT NOT NULL,
  flagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS on the flags table
ALTER TABLE public.user_content_flags ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see and modify their own flags
CREATE POLICY "Users can view own flags" ON public.user_content_flags
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own flags" ON public.user_content_flags
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own flags" ON public.user_content_flags
  FOR DELETE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_content_flags_user_id ON public.user_content_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_flags_content ON public.user_content_flags(content_type, content_id);

-- 2. Create the toggle flag function
CREATE OR REPLACE FUNCTION public.toggle_content_flag(
  p_user_id UUID,
  p_content_id BIGINT,
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
        WHERE id = p_content_id
        RETURNING flag INTO new_flag_count;
      WHEN 'paper' THEN
        UPDATE public.papers 
        SET flag = GREATEST(0, COALESCE(flag, 0) - 1)
        WHERE id = p_content_id
        RETURNING flag INTO new_flag_count;
      WHEN 'book' THEN
        UPDATE public.books 
        SET flag = GREATEST(0, COALESCE(flag, 0) - 1)
        WHERE id = p_content_id
        RETURNING flag INTO new_flag_count;
      WHEN 'insight' THEN
        UPDATE public.insights 
        SET flag = GREATEST(0, COALESCE(flag, 0) - 1)
        WHERE id = p_content_id
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
        WHERE id = p_content_id
        RETURNING flag INTO new_flag_count;
      WHEN 'paper' THEN
        UPDATE public.papers 
        SET flag = COALESCE(flag, 0) + 1
        WHERE id = p_content_id
        RETURNING flag INTO new_flag_count;
      WHEN 'book' THEN
        UPDATE public.books 
        SET flag = COALESCE(flag, 0) + 1
        WHERE id = p_content_id
        RETURNING flag INTO new_flag_count;
      WHEN 'insight' THEN
        UPDATE public.insights 
        SET flag = COALESCE(flag, 0) + 1
        WHERE id = p_content_id
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

-- 3. Create function to check if user has flagged content (fixed)
CREATE OR REPLACE FUNCTION public.check_user_flag_status(
  p_user_id UUID,
  p_content_ids BIGINT[],
  p_content_type TEXT
)
RETURNS TABLE(content_id BIGINT, is_flagged BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    content_ids.content_id,
    CASE 
      WHEN ucf.content_id IS NOT NULL THEN TRUE 
      ELSE FALSE 
    END as is_flagged
  FROM (
    SELECT unnest(p_content_ids) as content_id
  ) content_ids
  LEFT JOIN public.user_content_flags ucf ON (
    ucf.user_id = p_user_id 
    AND ucf.content_type = p_content_type 
    AND ucf.content_id = content_ids.content_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions
GRANT ALL ON TABLE public.user_content_flags TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_content_flag(UUID, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_flag_status(UUID, BIGINT[], TEXT) TO authenticated;

-- 5. Test and validation
DO $$
BEGIN
  RAISE NOTICE 'Flag system implementation complete!';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '- Toggle flag functionality (flag/unflag)';
  RAISE NOTICE '- Automatic flag count management';
  RAISE NOTICE '- User flag status tracking';
  RAISE NOTICE '- RLS security policies';
  RAISE NOTICE '- Performance indexes';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '- toggle_content_flag(user_id, content_id, content_type)';
  RAISE NOTICE '- check_user_flag_status(user_id, content_ids[], content_type)';
END $$;