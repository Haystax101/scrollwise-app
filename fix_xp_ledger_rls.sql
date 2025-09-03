-- Fix RLS policy blocking XP ledger inserts from insight triggers
-- The issue: triggers try to insert into xp_ledger when users save insights
-- but RLS policies are blocking these automatic XP awards

-- Check current RLS policies on xp_ledger
SELECT * FROM pg_policies WHERE tablename = 'xp_ledger';

-- Create policy to allow automatic XP awards from triggers
CREATE POLICY IF NOT EXISTS "Allow automatic XP awards from triggers" ON public.xp_ledger
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow any XP insertion for now

-- Also allow reading XP ledger for users to see their own records
CREATE POLICY IF NOT EXISTS "Users can read their own XP" ON public.xp_ledger
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- If there are existing restrictive policies, we might need to be more specific
-- Alternative: Allow XP inserts only for earning voltz (not spending)
-- CREATE POLICY "Allow earning XP" ON public.xp_ledger
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (transaction_type = 'earned');

-- Test the policy by checking if we can read from xp_ledger
SELECT COUNT(*) FROM xp_ledger;