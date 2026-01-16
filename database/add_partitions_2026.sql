-- Create partitions for 2026
-- Run this in Supabase SQL Editor to ensure logging works for the current year.

-- Partition for January 2026
CREATE TABLE IF NOT EXISTS public.learning_sessions_2026_01 PARTITION OF public.learning_sessions_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Partition for February 2026
CREATE TABLE IF NOT EXISTS public.learning_sessions_2026_02 PARTITION OF public.learning_sessions_partitioned
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Partition for March 2026
CREATE TABLE IF NOT EXISTS public.learning_sessions_2026_03 PARTITION OF public.learning_sessions_partitioned
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- (Optional) If the table used is just 'learning_sessions' and it IS partitioned, you might need to target that instead.
-- But based on your schema 'learning_sessions_partitioned' seems to be the partitioned one.
-- IF 'learning_sessions' is a separate regular table, the insert should have worked.
-- However, typically in these setups, one replaces the other.
-- To be safe, let's verify if 'learning_sessions' exists as a partitioned table.

-- If your RPC inserts into 'learning_sessions' but that table is actually 'learning_sessions_partitioned' in practice, 
-- update the previous RPC to point to 'learning_sessions_partitioned', OR ensure 'learning_sessions' has these partitions.

-- Let's assume 'learning_sessions' is the one we want to use (as per RPC).
-- If 'learning_sessions' fails to insert, it might be because it expects partitions.

DO $$
BEGIN
    -- Attempt to create partition on 'learning_sessions' if it is partitioned
    BEGIN
        CREATE TABLE IF NOT EXISTS public.learning_sessions_2026_01 PARTITION OF public.learning_sessions
        FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
    EXCEPTION WHEN OTHERS THEN
        -- Table might not be partitioned, ignore
        NULL;
    END;
END $$;
