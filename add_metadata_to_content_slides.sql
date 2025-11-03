-- Add Metadata Fields to content_slides Table
-- This makes content_slides self-sufficient without needing to reference articles/papers tables

-- Add title (for the cover slide)
ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled';

-- Add source link
ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS link TEXT;

-- Add source name (e.g., "TechCrunch", "Nature")
ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS site_name TEXT;

-- Add publication/creation date
ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS date DATE;

-- Add industry categorization
ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS industry_id UUID;

-- Add foreign key constraint for industry_id
ALTER TABLE public.content_slides
ADD CONSTRAINT content_slides_industry_id_fkey
FOREIGN KEY (industry_id) REFERENCES public.industries(id);

-- Add authors (array to support multiple authors for papers)
ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS authors TEXT[];

-- Add engagement metrics
ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS likes_count BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS saves_count BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS comments_count BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS views_count BIGINT NOT NULL DEFAULT 0;

-- Add category/topic field (for the green text on cover slide like "Technology and AI")
ALTER TABLE public.content_slides
ADD COLUMN IF NOT EXISTS category TEXT;

-- Optional: Remove the default from title after data migration
-- ALTER TABLE public.content_slides ALTER COLUMN title DROP DEFAULT;

-- Create index on industry_id for faster queries
CREATE INDEX IF NOT EXISTS idx_content_slides_industry_id
ON public.content_slides(industry_id);

-- Create index on date for sorting
CREATE INDEX IF NOT EXISTS idx_content_slides_date
ON public.content_slides(date DESC);

-- Create composite index for common queries (content_type + industry_id + date)
CREATE INDEX IF NOT EXISTS idx_content_slides_feed_query
ON public.content_slides(content_type, industry_id, date DESC);

-- Add comments for documentation
COMMENT ON COLUMN public.content_slides.title IS 'Title displayed on the cover slide';
COMMENT ON COLUMN public.content_slides.link IS 'Source URL for the original content';
COMMENT ON COLUMN public.content_slides.site_name IS 'Source name (e.g., TechCrunch, Nature)';
COMMENT ON COLUMN public.content_slides.date IS 'Publication or creation date';
COMMENT ON COLUMN public.content_slides.industry_id IS 'Industry/topic categorization';
COMMENT ON COLUMN public.content_slides.authors IS 'Author(s) - array to support multiple authors';
COMMENT ON COLUMN public.content_slides.category IS 'Category label for cover slide (e.g., Technology and AI)';
COMMENT ON COLUMN public.content_slides.likes_count IS 'Number of likes';
COMMENT ON COLUMN public.content_slides.saves_count IS 'Number of saves';
COMMENT ON COLUMN public.content_slides.comments_count IS 'Number of comments';
COMMENT ON COLUMN public.content_slides.views_count IS 'Number of views';

-- Note: content_id and content_type are kept for backward compatibility
-- and for tracking which original article/paper this was generated from
-- but content_slides is now self-sufficient and doesn't require joining to articles/papers

-- Verification query
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'content_slides'
  AND table_schema = 'public'
ORDER BY ordinal_position;
