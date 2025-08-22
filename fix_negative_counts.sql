-- Fix Negative Counts Issue
-- This script addresses the -1 likes/saves/comments problem by:
-- 1. Cleaning up orphaned interaction records
-- 2. Fixing foreign key constraints to use CASCADE DELETE
-- 3. Recalculating all counts to ensure accuracy

BEGIN;

-- =============================================================================
-- STEP 1: Clean up orphaned interaction records
-- =============================================================================

DO $$
DECLARE
    orphaned_count integer;
BEGIN
    -- Check and remove orphaned article interactions
    SELECT COUNT(*) INTO orphaned_count FROM article_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned article_likes records', orphaned_count;
        DELETE FROM article_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM article_saves WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned article_saves records', orphaned_count;
        DELETE FROM article_saves WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM article_views WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned article_views records', orphaned_count;
        DELETE FROM article_views WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    -- Check and remove orphaned paper interactions
    SELECT COUNT(*) INTO orphaned_count FROM paper_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned paper_likes records', orphaned_count;
        DELETE FROM paper_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM paper_saves WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned paper_saves records', orphaned_count;
        DELETE FROM paper_saves WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM paper_views WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned paper_views records', orphaned_count;
        DELETE FROM paper_views WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    -- Check and remove orphaned book interactions
    SELECT COUNT(*) INTO orphaned_count FROM book_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned book_likes records', orphaned_count;
        DELETE FROM book_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM book_saves WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned book_saves records', orphaned_count;
        DELETE FROM book_saves WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM book_views WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned book_views records', orphaned_count;
        DELETE FROM book_views WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    -- Check and remove orphaned insight interactions
    SELECT COUNT(*) INTO orphaned_count FROM insight_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned insight_likes records', orphaned_count;
        DELETE FROM insight_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM insight_saves WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned insight_saves records', orphaned_count;
        DELETE FROM insight_saves WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM insight_views WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned insight_views records', orphaned_count;
        DELETE FROM insight_views WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    -- Check and remove orphaned comment interactions
    SELECT COUNT(*) INTO orphaned_count FROM comments WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned comments records', orphaned_count;
        DELETE FROM comments WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM paper_comments WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned paper_comments records', orphaned_count;
        DELETE FROM paper_comments WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM book_comments WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned book_comments records', orphaned_count;
        DELETE FROM book_comments WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM insight_comments WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned insight_comments records', orphaned_count;
        DELETE FROM insight_comments WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    -- Check and remove orphaned comment likes
    SELECT COUNT(*) INTO orphaned_count FROM article_comment_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned article_comment_likes records', orphaned_count;
        DELETE FROM article_comment_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM paper_comment_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned paper_comment_likes records', orphaned_count;
        DELETE FROM paper_comment_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM book_comment_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned book_comment_likes records', orphaned_count;
        DELETE FROM book_comment_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM insight_comment_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned insight_comment_likes records', orphaned_count;
        DELETE FROM insight_comment_likes WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    -- Check and remove other orphaned user-related records
    SELECT COUNT(*) INTO orphaned_count FROM content_views WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned content_views records', orphaned_count;
        DELETE FROM content_views WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM quiz_attempts WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned quiz_attempts records', orphaned_count;
        DELETE FROM quiz_attempts WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    SELECT COUNT(*) INTO orphaned_count FROM xp_ledger WHERE user_id NOT IN (SELECT id FROM profiles);
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removing % orphaned xp_ledger records', orphaned_count;
        DELETE FROM xp_ledger WHERE user_id NOT IN (SELECT id FROM profiles);
    END IF;

    RAISE NOTICE 'Orphaned record cleanup completed';
END $$;

-- =============================================================================
-- STEP 2: Fix foreign key constraints to use CASCADE DELETE
-- =============================================================================

RAISE NOTICE 'Updating foreign key constraints to use CASCADE DELETE...';

-- Article interactions
ALTER TABLE article_likes 
DROP CONSTRAINT IF EXISTS article_likes_user_id_fkey,
ADD CONSTRAINT article_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE article_saves 
DROP CONSTRAINT IF EXISTS article_saves_user_id_fkey,
ADD CONSTRAINT article_saves_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE article_views 
DROP CONSTRAINT IF EXISTS article_views_user_id_fkey,
ADD CONSTRAINT article_views_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE article_views_enhanced 
DROP CONSTRAINT IF EXISTS article_views_enhanced_user_id_fkey,
ADD CONSTRAINT article_views_enhanced_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Paper interactions
ALTER TABLE paper_likes 
DROP CONSTRAINT IF EXISTS paper_likes_user_id_fkey,
ADD CONSTRAINT paper_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE paper_saves 
DROP CONSTRAINT IF EXISTS paper_saves_user_id_fkey,
ADD CONSTRAINT paper_saves_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE paper_views 
DROP CONSTRAINT IF EXISTS paper_views_user_id_fkey,
ADD CONSTRAINT paper_views_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Book interactions
ALTER TABLE book_likes 
DROP CONSTRAINT IF EXISTS book_likes_user_id_fkey,
ADD CONSTRAINT book_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE book_saves 
DROP CONSTRAINT IF EXISTS book_saves_user_id_fkey,
ADD CONSTRAINT book_saves_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE book_views 
DROP CONSTRAINT IF EXISTS book_views_user_id_fkey,
ADD CONSTRAINT book_views_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Insight interactions
ALTER TABLE insight_likes 
DROP CONSTRAINT IF EXISTS insight_likes_user_id_fkey,
ADD CONSTRAINT insight_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE insight_saves 
DROP CONSTRAINT IF EXISTS insight_saves_user_id_fkey,
ADD CONSTRAINT insight_saves_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE insight_views 
DROP CONSTRAINT IF EXISTS insight_views_user_id_fkey,
ADD CONSTRAINT insight_views_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Comments
ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS comments_user_id_fkey,
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE paper_comments 
DROP CONSTRAINT IF EXISTS paper_comments_user_id_fkey,
ADD CONSTRAINT paper_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE book_comments 
DROP CONSTRAINT IF EXISTS book_comments_user_id_fkey,
ADD CONSTRAINT book_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE insight_comments 
DROP CONSTRAINT IF EXISTS insight_comments_user_id_fkey,
ADD CONSTRAINT insight_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Comment likes
ALTER TABLE article_comment_likes 
DROP CONSTRAINT IF EXISTS article_comment_likes_user_id_fkey,
ADD CONSTRAINT article_comment_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE paper_comment_likes 
DROP CONSTRAINT IF EXISTS paper_comment_likes_user_id_fkey,
ADD CONSTRAINT paper_comment_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE book_comment_likes 
DROP CONSTRAINT IF EXISTS book_comment_likes_user_id_fkey,
ADD CONSTRAINT book_comment_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE insight_comment_likes 
DROP CONSTRAINT IF EXISTS insight_comment_likes_user_id_fkey,
ADD CONSTRAINT insight_comment_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Other user-related tables
ALTER TABLE content_views 
DROP CONSTRAINT IF EXISTS content_views_user_id_fkey,
ADD CONSTRAINT content_views_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE quiz_attempts 
DROP CONSTRAINT IF EXISTS quiz_attempts_user_id_fkey,
ADD CONSTRAINT quiz_attempts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE xp_ledger 
DROP CONSTRAINT IF EXISTS xp_ledger_user_id_fkey,
ADD CONSTRAINT xp_ledger_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 3: Recalculate all counts to ensure accuracy
-- =============================================================================

RAISE NOTICE 'Recalculating all content counts...';

-- Recalculate article counts
UPDATE articles SET 
    likes_count = (SELECT COUNT(*) FROM article_likes WHERE article_id = articles.id),
    saves_count = (SELECT COUNT(*) FROM article_saves WHERE article_id = articles.id),
    comments_count = (SELECT COUNT(*) FROM comments WHERE article_id = articles.id),
    views_count = GREATEST((SELECT COUNT(*) FROM article_views WHERE article_id = articles.id), views_count);

-- Recalculate paper counts
UPDATE papers SET 
    likes_count = (SELECT COUNT(*) FROM paper_likes WHERE paper_id = papers.id),
    saves_count = (SELECT COUNT(*) FROM paper_saves WHERE paper_id = papers.id),
    comments_count = (SELECT COUNT(*) FROM paper_comments WHERE paper_id = papers.id),
    views_count = GREATEST((SELECT COUNT(*) FROM paper_views WHERE paper_id = papers.id), views_count);

-- Recalculate book counts
UPDATE books SET 
    likes_count = (SELECT COUNT(*) FROM book_likes WHERE book_id = books.id),
    saves_count = (SELECT COUNT(*) FROM book_saves WHERE book_id = books.id),
    comments_count = (SELECT COUNT(*) FROM book_comments WHERE book_id = books.id),
    views_count = GREATEST((SELECT COUNT(*) FROM book_views WHERE book_id = books.id), views_count);

-- Recalculate insight counts
UPDATE insights SET 
    likes_count = (SELECT COUNT(*) FROM insight_likes WHERE insight_id = insights.id),
    saves_count = (SELECT COUNT(*) FROM insight_saves WHERE insight_id = insights.id),
    comments_count = (SELECT COUNT(*) FROM insight_comments WHERE insight_id = insights.id),
    views_count = GREATEST((SELECT COUNT(*) FROM insight_views WHERE insight_id = insights.id), views_count);

-- Recalculate comment counts and reply counts
UPDATE comments SET 
    likes_count = (SELECT COUNT(*) FROM article_comment_likes WHERE comment_id = comments.id),
    reply_count = (SELECT COUNT(*) FROM comments c WHERE c.parent_comment_id = comments.id);

UPDATE paper_comments SET 
    likes_count = (SELECT COUNT(*) FROM paper_comment_likes WHERE comment_id = paper_comments.id),
    reply_count = (SELECT COUNT(*) FROM paper_comments c WHERE c.parent_comment_id = paper_comments.id);

UPDATE book_comments SET 
    likes_count = (SELECT COUNT(*) FROM book_comment_likes WHERE comment_id = book_comments.id),
    reply_count = (SELECT COUNT(*) FROM book_comments c WHERE c.parent_comment_id = book_comments.id);

UPDATE insight_comments SET 
    likes_count = (SELECT COUNT(*) FROM insight_comment_likes WHERE comment_id = insight_comments.id),
    reply_count = (SELECT COUNT(*) FROM insight_comments c WHERE c.parent_comment_id = insight_comments.id);

-- =============================================================================
-- STEP 4: Add safeguards to prevent negative counts
-- =============================================================================

-- Create a function to ensure counts never go below zero
CREATE OR REPLACE FUNCTION ensure_non_negative_counts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.likes_count = GREATEST(COALESCE(NEW.likes_count, 0), 0);
    NEW.saves_count = GREATEST(COALESCE(NEW.saves_count, 0), 0);
    NEW.comments_count = GREATEST(COALESCE(NEW.comments_count, 0), 0);
    NEW.views_count = GREATEST(COALESCE(NEW.views_count, 0), 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the safeguard trigger to all content tables
DROP TRIGGER IF EXISTS ensure_articles_non_negative_counts ON articles;
CREATE TRIGGER ensure_articles_non_negative_counts
    BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION ensure_non_negative_counts();

DROP TRIGGER IF EXISTS ensure_papers_non_negative_counts ON papers;
CREATE TRIGGER ensure_papers_non_negative_counts
    BEFORE UPDATE ON papers
    FOR EACH ROW EXECUTE FUNCTION ensure_non_negative_counts();

DROP TRIGGER IF EXISTS ensure_books_non_negative_counts ON books;
CREATE TRIGGER ensure_books_non_negative_counts
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION ensure_non_negative_counts();

DROP TRIGGER IF EXISTS ensure_insights_non_negative_counts ON insights;
CREATE TRIGGER ensure_insights_non_negative_counts
    BEFORE UPDATE ON insights
    FOR EACH ROW EXECUTE FUNCTION ensure_non_negative_counts();

-- Create a function for comment counts (which also have reply_count)
CREATE OR REPLACE FUNCTION ensure_non_negative_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.likes_count = GREATEST(COALESCE(NEW.likes_count, 0), 0);
    NEW.reply_count = GREATEST(COALESCE(NEW.reply_count, 0), 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to comment tables
DROP TRIGGER IF EXISTS ensure_comments_non_negative_counts ON comments;
CREATE TRIGGER ensure_comments_non_negative_counts
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION ensure_non_negative_comment_counts();

DROP TRIGGER IF EXISTS ensure_paper_comments_non_negative_counts ON paper_comments;
CREATE TRIGGER ensure_paper_comments_non_negative_counts
    BEFORE UPDATE ON paper_comments
    FOR EACH ROW EXECUTE FUNCTION ensure_non_negative_comment_counts();

DROP TRIGGER IF EXISTS ensure_book_comments_non_negative_counts ON book_comments;
CREATE TRIGGER ensure_book_comments_non_negative_counts
    BEFORE UPDATE ON book_comments
    FOR EACH ROW EXECUTE FUNCTION ensure_non_negative_comment_counts();

DROP TRIGGER IF EXISTS ensure_insight_comments_non_negative_counts ON insight_comments;
CREATE TRIGGER ensure_insight_comments_non_negative_counts
    BEFORE UPDATE ON insight_comments
    FOR EACH ROW EXECUTE FUNCTION ensure_non_negative_comment_counts();

-- =============================================================================
-- STEP 5: Verification and summary
-- =============================================================================

-- Check for any remaining negative counts
DO $$
DECLARE
    negative_articles integer;
    negative_papers integer;
    negative_books integer;
    negative_insights integer;
BEGIN
    SELECT COUNT(*) INTO negative_articles FROM articles 
    WHERE likes_count < 0 OR saves_count < 0 OR comments_count < 0 OR views_count < 0;
    
    SELECT COUNT(*) INTO negative_papers FROM papers 
    WHERE likes_count < 0 OR saves_count < 0 OR comments_count < 0 OR views_count < 0;
    
    SELECT COUNT(*) INTO negative_books FROM books 
    WHERE likes_count < 0 OR saves_count < 0 OR comments_count < 0 OR views_count < 0;
    
    SELECT COUNT(*) INTO negative_insights FROM insights 
    WHERE likes_count < 0 OR saves_count < 0 OR comments_count < 0 OR views_count < 0;
    
    IF negative_articles > 0 OR negative_papers > 0 OR negative_books > 0 OR negative_insights > 0 THEN
        RAISE WARNING 'Still found negative counts: Articles: %, Papers: %, Books: %, Insights: %', 
            negative_articles, negative_papers, negative_books, negative_insights;
    ELSE
        RAISE NOTICE 'All counts are now non-negative!';
    END IF;
END $$;

COMMIT;

RAISE NOTICE 'Fix complete! Summary:';
RAISE NOTICE '1. Cleaned up orphaned interaction records';
RAISE NOTICE '2. Updated foreign key constraints to use CASCADE DELETE';
RAISE NOTICE '3. Recalculated all content counts';
RAISE NOTICE '4. Added safeguard triggers to prevent negative counts';
RAISE NOTICE '5. Future user deletions will automatically clean up related records';