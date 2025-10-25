-- Script to delete flagged content and display source information
-- This script processes entries from user_content_flags table and deletes the corresponding content
-- from articles, papers, or books tables while displaying the source information

-- Step 1: Display articles being deleted (with source)
SELECT
  'article' as content_type,
  a.id as content_id,
  a.title,
  COALESCE(a.site_name, 'Unknown source') as source,
  a.link,
  COUNT(ucf.id) as flag_count,
  COUNT(DISTINCT ucf.user_id) as flagged_by_users,
  a.created_at
FROM user_content_flags ucf
JOIN articles a ON a.id = ucf.content_id::integer
WHERE ucf.content_type = 'article'
GROUP BY a.id, a.title, a.site_name, a.link, a.created_at;

-- Step 2: Display papers being deleted (with source)
SELECT
  'paper' as content_type,
  p.id as content_id,
  p.title,
  COALESCE(p.site_name, 'Unknown source') as source,
  p.authors,
  p.link,
  COUNT(ucf.id) as flag_count,
  COUNT(DISTINCT ucf.user_id) as flagged_by_users,
  p.created_at
FROM user_content_flags ucf
JOIN papers p ON p.id = ucf.content_id::bigint
WHERE ucf.content_type = 'paper'
GROUP BY p.id, p.title, p.site_name, p.authors, p.link, p.created_at;

-- Step 3: Display books being deleted (no source field for books)
SELECT
  'book' as content_type,
  b.id as content_id,
  b.title,
  'N/A - Books have no source' as source,
  b.author,
  b.year,
  COUNT(ucf.id) as flag_count,
  COUNT(DISTINCT ucf.user_id) as flagged_by_users,
  b.created_at
FROM user_content_flags ucf
JOIN books b ON b.id = ucf.content_id::bigint
WHERE ucf.content_type = 'book'
GROUP BY b.id, b.title, b.author, b.year, b.created_at;

-- Step 4: Delete articles
-- Note: Related records in article_likes, article_saves, article_views, comments, etc.
-- should cascade delete if foreign keys are set up with ON DELETE CASCADE
DELETE FROM articles
WHERE id IN (
  SELECT content_id::integer
  FROM user_content_flags
  WHERE content_type = 'article'
);

-- Step 5: Delete papers
-- Note: Related records in paper_likes, paper_saves, paper_views, paper_comments, etc.
-- should cascade delete if foreign keys are set up with ON DELETE CASCADE
DELETE FROM papers
WHERE id IN (
  SELECT content_id::bigint
  FROM user_content_flags
  WHERE content_type = 'paper'
);

-- Step 6: Delete books
-- Note: Related records in book_likes, book_saves, book_views, book_comments, etc.
-- should cascade delete if foreign keys are set up with ON DELETE CASCADE
DELETE FROM books
WHERE id IN (
  SELECT content_id::bigint
  FROM user_content_flags
  WHERE content_type = 'book'
);

-- Step 7: Clean up the user_content_flags table
-- Remove flags for content that has been deleted
DELETE FROM user_content_flags
WHERE content_type IN ('article', 'paper', 'book');
