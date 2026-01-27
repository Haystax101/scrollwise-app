-- Add Social Columns to Timelapse Sessions
ALTER TABLE public.timelapse_sessions 
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text;

-- 1. Timelapse Likes
CREATE TABLE IF NOT EXISTS public.timelapse_likes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timelapse_id uuid NOT NULL REFERENCES public.timelapse_sessions(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT timelapse_likes_pkey PRIMARY KEY (id),
    CONSTRAINT timelapse_likes_unique UNIQUE (user_id, timelapse_id)
);

ALTER TABLE public.timelapse_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can like timelapses"
ON public.timelapse_likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike timelapses"
ON public.timelapse_likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view timelapse likes"
ON public.timelapse_likes FOR SELECT TO authenticated
USING (true);

-- 2. Timelapse Comments
CREATE TABLE IF NOT EXISTS public.timelapse_comments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timelapse_id uuid NOT NULL REFERENCES public.timelapse_sessions(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT timelapse_comments_pkey PRIMARY KEY (id)
);

ALTER TABLE public.timelapse_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can comment on timelapses"
ON public.timelapse_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.timelapse_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view timelapse comments"
ON public.timelapse_comments FOR SELECT TO authenticated
USING (true);

-- 3. Timelapse Saves
CREATE TABLE IF NOT EXISTS public.timelapse_saves (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timelapse_id uuid NOT NULL REFERENCES public.timelapse_sessions(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT timelapse_saves_pkey PRIMARY KEY (id),
    CONSTRAINT timelapse_saves_unique UNIQUE (user_id, timelapse_id)
);

ALTER TABLE public.timelapse_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can save timelapses"
ON public.timelapse_saves FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave timelapses"
ON public.timelapse_saves FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own saves"
ON public.timelapse_saves FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 4. ROBUST TRIGGER FUNCTIONS

-- Update Likes Count
CREATE OR REPLACE FUNCTION update_timelapse_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.timelapse_sessions
        SET likes_count = likes_count + 1
        WHERE id = NEW.timelapse_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.timelapse_sessions
        SET likes_count = likes_count - 1
        WHERE id = OLD.timelapse_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_timelapse_likes
AFTER INSERT OR DELETE ON public.timelapse_likes
FOR EACH ROW EXECUTE FUNCTION update_timelapse_likes_count();

-- Update Comments Count
CREATE OR REPLACE FUNCTION update_timelapse_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.timelapse_sessions
        SET comments_count = comments_count + 1
        WHERE id = NEW.timelapse_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.timelapse_sessions
        SET comments_count = comments_count - 1
        WHERE id = OLD.timelapse_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_timelapse_comments
AFTER INSERT OR DELETE ON public.timelapse_comments
FOR EACH ROW EXECUTE FUNCTION update_timelapse_comments_count();

-- Update Saves Count
CREATE OR REPLACE FUNCTION update_timelapse_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.timelapse_sessions
        SET saves_count = saves_count + 1
        WHERE id = NEW.timelapse_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.timelapse_sessions
        SET saves_count = saves_count - 1
        WHERE id = OLD.timelapse_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_timelapse_saves
AFTER INSERT OR DELETE ON public.timelapse_saves
FOR EACH ROW EXECUTE FUNCTION update_timelapse_saves_count();
