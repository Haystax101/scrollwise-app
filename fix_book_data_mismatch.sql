-- Fix book title/summary mismatch for Design Patterns book
-- This script identifies and corrects data inconsistencies in the books table

-- Find books with potential title/summary mismatches
SELECT 
  id,
  title,
  short_summary,
  author,
  year
FROM books 
WHERE 
  title ILIKE '%design%pattern%' OR
  title ILIKE '%pattern%design%' OR
  short_summary ILIKE '%design%pattern%' OR
  short_summary ILIKE '%pattern%design%'
ORDER BY title;

-- Update the Design Patterns book with correct information
UPDATE books 
SET 
  title = 'Design Patterns: Elements of Reusable Object-Oriented Software',
  short_summary = 'The definitive guide to design patterns, presenting 23 proven patterns for creating flexible, reusable object-oriented software. Essential reading for software developers.',
  author = 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
  year = 1994
WHERE 
  (title ILIKE '%design%pattern%' OR title ILIKE '%pattern%design%')
  AND (
    title != 'Design Patterns: Elements of Reusable Object-Oriented Software' OR
    short_summary NOT ILIKE '%definitive guide to design patterns%'
  );

-- Verify the fix
SELECT 
  id,
  title,
  short_summary,
  author,
  year
FROM books 
WHERE title ILIKE '%design%pattern%'
ORDER BY title;