-- Database Migration: Reels to Articles
-- Run these commands in your Supabase SQL editor

-- 1. Rename reel_likes table to article_likes and update column names
ALTER TABLE reel_likes RENAME TO article_likes;
ALTER TABLE article_likes RENAME COLUMN reel_id TO article_id;

-- 2. Rename reel_saves table to article_saves and update column names  
ALTER TABLE reel_saves RENAME TO article_saves;
ALTER TABLE article_saves RENAME COLUMN reel_id TO article_id;

-- 3. Handle comments table first (since it has NOT NULL constraint)
-- Delete comments that reference non-existent articles
DELETE FROM comments 
WHERE reel_id NOT IN (SELECT id FROM articles);

-- Rename reel_id to article_id in comments table
ALTER TABLE comments RENAME COLUMN reel_id TO article_id;

-- 4. Clean up orphaned data before adding constraints
-- Delete likes that reference non-existent articles
DELETE FROM article_likes 
WHERE article_id NOT IN (SELECT id FROM articles);

-- Delete saves that reference non-existent articles  
DELETE FROM article_saves 
WHERE article_id NOT IN (SELECT id FROM articles);

-- 5. Add foreign key constraints to ensure data integrity
ALTER TABLE article_likes 
ADD CONSTRAINT fk_article_likes_article_id 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

ALTER TABLE article_likes 
ADD CONSTRAINT fk_article_likes_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE article_saves 
ADD CONSTRAINT fk_article_saves_article_id 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

ALTER TABLE article_saves 
ADD CONSTRAINT fk_article_saves_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key for comments table
ALTER TABLE comments 
ADD CONSTRAINT fk_comments_article_id 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

-- 6. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user_id ON article_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_article_saves_article_id ON article_saves(article_id);
CREATE INDEX IF NOT EXISTS idx_article_saves_user_id ON article_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_industry_id ON articles(industry_id);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);

-- 7. Add unique constraints to prevent duplicate likes/saves
ALTER TABLE article_likes 
ADD CONSTRAINT unique_article_like 
UNIQUE (user_id, article_id);

ALTER TABLE article_saves 
ADD CONSTRAINT unique_article_save 
UNIQUE (user_id, article_id);

-- 8. Ensure articles table has proper constraints (if not already present)
-- Only add if the constraint doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_articles_industry_id'
    ) THEN
        ALTER TABLE articles 
        ADD CONSTRAINT fk_articles_industry_id 
        FOREIGN KEY (industry_id) REFERENCES industries(id);
    END IF;
END $$;

-- 9. Add RLS policies for articles table (adjust based on your security needs)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Articles are viewable by everyone" ON articles;
DROP POLICY IF EXISTS "Users can manage their own article likes" ON article_likes;
DROP POLICY IF EXISTS "Users can manage their own article saves" ON article_saves;

-- Allow everyone to read articles
CREATE POLICY "Articles are viewable by everyone" ON articles
FOR SELECT USING (true);

-- Allow authenticated users to like articles
CREATE POLICY "Users can manage their own article likes" ON article_likes
FOR ALL USING (auth.uid() = user_id);

-- Allow authenticated users to save articles  
CREATE POLICY "Users can manage their own article saves" ON article_saves
FOR ALL USING (auth.uid() = user_id); 