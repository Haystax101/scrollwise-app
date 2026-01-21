-- Migration: Convert Friends to Followers
-- Converts all 'accepted' friendships into bidirectional follow records in the 'follows' table.

DO $$
DECLARE
    r RECORD;
    count_converted INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting migration of friends to follows...';

    FOR r IN SELECT requester_id, addressee_id FROM public.friendships WHERE status = 'accepted'
    LOOP
        -- 1. Requester follows Addressee
        BEGIN
            INSERT INTO public.follows (follower_id, following_id)
            VALUES (r.requester_id, r.addressee_id)
            ON CONFLICT (follower_id, following_id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating follow for % -> %: %', r.requester_id, r.addressee_id, SQLERRM;
        END;

        -- 2. Addressee follows Requester
        BEGIN
            INSERT INTO public.follows (follower_id, following_id)
            VALUES (r.addressee_id, r.requester_id)
            ON CONFLICT (follower_id, following_id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating follow for % -> %: %', r.addressee_id, r.requester_id, SQLERRM;
        END;

        count_converted := count_converted + 1;
    END LOOP;

    RAISE NOTICE 'Migration completed. Processed % friendships (creating up to % follow records).', count_converted, count_converted * 2;
END $$;
