-- Fix profile permissions for insights
-- This adds a targeted policy for insight author visibility

-- Add a policy that allows reading basic profile info for insight authors
-- This is safe because:
-- 1. It only allows SELECT (no updates/inserts)  
-- 2. The application only queries name and avatar for insights
-- 3. Users who post insights are making their content public anyway

CREATE POLICY "Allow basic profile info for insights" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Allow reading profiles of users who have authored insights
  id IN (
    SELECT DISTINCT author_id 
    FROM public.insights 
    WHERE author_id IS NOT NULL
  )
);

-- This policy will work alongside the existing comprehensive policy
-- using OR logic, so it won't break existing functionality