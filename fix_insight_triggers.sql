-- Fix missing insight engagement triggers
-- Run this SQL in Supabase SQL Editor

-- 1. Create function to update insight likes count
CREATE OR REPLACE FUNCTION update_insight_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE insights 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.insight_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE insights 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.insight_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to update insight saves count
CREATE OR REPLACE FUNCTION update_insight_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE insights 
    SET saves_count = saves_count + 1 
    WHERE id = NEW.insight_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE insights 
    SET saves_count = GREATEST(0, saves_count - 1) 
    WHERE id = OLD.insight_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger for insight likes
DROP TRIGGER IF EXISTS trigger_insight_likes_count ON insight_likes;
CREATE TRIGGER trigger_insight_likes_count
  AFTER INSERT OR DELETE ON insight_likes
  FOR EACH ROW EXECUTE FUNCTION update_insight_likes_count();

-- 4. Create trigger for insight saves  
DROP TRIGGER IF EXISTS trigger_insight_saves_count ON insight_saves;
CREATE TRIGGER trigger_insight_saves_count
  AFTER INSERT OR DELETE ON insight_saves
  FOR EACH ROW EXECUTE FUNCTION update_insight_saves_count();

-- 5. Fix any existing counts (run once to correct current data)
UPDATE insights SET 
  likes_count = (
    SELECT COUNT(*) FROM insight_likes 
    WHERE insight_likes.insight_id = insights.id
  ),
  saves_count = (
    SELECT COUNT(*) FROM insight_saves 
    WHERE insight_saves.insight_id = insights.id
  );

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_insight_likes_count() TO authenticated;
GRANT EXECUTE ON FUNCTION update_insight_saves_count() TO authenticated;