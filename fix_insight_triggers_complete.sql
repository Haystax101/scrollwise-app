-- Complete fix for insight engagement triggers
-- Run this SQL in Supabase SQL Editor

-- ========================================
-- 1. CREATE MISSING TRIGGER FUNCTIONS
-- ========================================

-- Function to update insight likes count (MISSING)
CREATE OR REPLACE FUNCTION update_insight_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.insights 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.insight_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.insights 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.insight_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp';

-- Function to update insight saves count (MISSING)
CREATE OR REPLACE FUNCTION update_insight_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.insights 
    SET saves_count = saves_count + 1 
    WHERE id = NEW.insight_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.insights 
    SET saves_count = GREATEST(0, saves_count - 1) 
    WHERE id = OLD.insight_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp';

-- ========================================
-- 2. CREATE MISSING TRIGGERS
-- ========================================

-- Trigger for insight likes → insights.likes_count (MISSING)
DROP TRIGGER IF EXISTS trigger_insight_likes_count ON public.insight_likes;
CREATE TRIGGER trigger_insight_likes_count
  AFTER INSERT OR DELETE ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION update_insight_likes_count();

-- Trigger for insight saves → insights.saves_count (MISSING) 
DROP TRIGGER IF EXISTS trigger_insight_saves_count ON public.insight_saves;
CREATE TRIGGER trigger_insight_saves_count
  AFTER INSERT OR DELETE ON public.insight_saves
  FOR EACH ROW EXECUTE FUNCTION update_insight_saves_count();

-- ========================================
-- 3. ADD MISSING NON-NEGATIVE CONSTRAINT TRIGGER
-- ========================================

-- Ensure insights table has non-negative counts (like other content types)
DROP TRIGGER IF EXISTS ensure_insights_non_negative_counts ON public.insights;
CREATE TRIGGER ensure_insights_non_negative_counts
  BEFORE UPDATE ON public.insights
  FOR EACH ROW EXECUTE FUNCTION ensure_non_negative_counts();

-- ========================================
-- 4. FIX CURRENT DATA (run once to correct existing counts)
-- ========================================

-- Recalculate all insight counts to fix any inconsistencies
UPDATE public.insights SET 
  likes_count = (
    SELECT COUNT(*) FROM public.insight_likes 
    WHERE insight_likes.insight_id = insights.id
  ),
  saves_count = (
    SELECT COUNT(*) FROM public.insight_saves 
    WHERE insight_saves.insight_id = insights.id
  ),
  comments_count = (
    SELECT COUNT(*) FROM public.insight_comments 
    WHERE insight_comments.insight_id = insights.id
  ),
  views_count = (
    SELECT COUNT(*) FROM public.insight_views 
    WHERE insight_views.insight_id = insights.id
  );

-- ========================================
-- 5. GRANT PERMISSIONS
-- ========================================

GRANT EXECUTE ON FUNCTION update_insight_likes_count() TO authenticated;
GRANT EXECUTE ON FUNCTION update_insight_saves_count() TO authenticated;

-- ========================================
-- 6. VERIFY RESULTS
-- ========================================

-- Check that triggers are working by showing a few insights with their counts
SELECT 
  i.id,
  LEFT(i.content, 50) as content_preview,
  i.likes_count,
  i.saves_count,
  i.comments_count,
  i.views_count,
  (SELECT COUNT(*) FROM insight_likes WHERE insight_id = i.id) as actual_likes,
  (SELECT COUNT(*) FROM insight_saves WHERE insight_id = i.id) as actual_saves,
  (SELECT COUNT(*) FROM insight_comments WHERE insight_id = i.id) as actual_comments,
  (SELECT COUNT(*) FROM insight_views WHERE insight_id = i.id) as actual_views
FROM public.insights i
LIMIT 5;