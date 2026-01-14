-- Create the table to track user consensus on the new format
CREATE TABLE IF NOT EXISTS public.new_format_concensus (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preference BOOLEAN NOT NULL, -- true = Likes it (Yes), false = Dislikes it (No)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.new_format_concensus ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own vote
CREATE POLICY "Users can insert their own vote" ON public.new_format_concensus
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own vote
CREATE POLICY "Users can view their own vote" ON public.new_format_concensus
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own vote (optional, but good for changing mind)
CREATE POLICY "Users can update their own vote" ON public.new_format_concensus
    FOR UPDATE
    USING (auth.uid() = user_id);
