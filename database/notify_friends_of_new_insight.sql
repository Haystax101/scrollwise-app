-- Trigger function to send notifications when a new insight is created
-- This function:
-- 1. Identifies the author of the new insight
-- 2. Selects all friends of the author (accepted friendships)
-- 3. Inserts a notification record for each friend

CREATE OR REPLACE FUNCTION public.notify_friends_of_new_insight()
RETURNS TRIGGER AS $$
DECLARE
    friend_record RECORD;
    author_name TEXT;
    batch_id UUID;
BEGIN
    -- unique batch ID for this notification set
    batch_id := gen_random_uuid();
    
    -- Get author's name for the notification message
    SELECT full_name INTO author_name FROM public.profiles WHERE id = NEW.author_id;
    
    -- Iterate through all accepted friendships where the author is one of the parties
    FOR friend_record IN 
        SELECT 
            CASE 
                WHEN requester_id = NEW.author_id THEN addressee_id
                ELSE requester_id 
            END as friend_id
        FROM public.friendships 
        WHERE (requester_id = NEW.author_id OR addressee_id = NEW.author_id)
        AND status = 'accepted'
    LOOP
        -- Insert notification for each friend
        INSERT INTO public.notifications (
            user_id,
            type,
            source_user_id,
            content_type,
            content_id,
            message,
            batch_id,
            action_url,
            created_at
        ) VALUES (
            friend_record.friend_id,
            'friend_insight',
            NEW.author_id,
            'insight',
            NEW.id::text,
            author_name || ' posted a new insight',
            batch_id,
            '/insight/' || NEW.id,
            NOW()
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow recreating
DROP TRIGGER IF EXISTS on_insight_created ON public.insights;

-- Create the trigger
CREATE TRIGGER on_insight_created
AFTER INSERT ON public.insights
FOR EACH ROW
EXECUTE FUNCTION public.notify_friends_of_new_insight();
