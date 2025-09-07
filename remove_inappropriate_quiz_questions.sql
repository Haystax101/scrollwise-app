-- SQL script to remove quiz questions with "FUCK" in option_d field
-- Run this directly in your database console (e.g., Supabase SQL Editor)

-- First delete quiz attempts that reference these questions (to maintain referential integrity)
DELETE FROM quiz_attempts 
WHERE question_id IN (
    SELECT id 
    FROM quiz_questions 
    WHERE option_d ILIKE '%FUCK%'
);

-- Then delete the inappropriate quiz questions
DELETE FROM quiz_questions 
WHERE option_d ILIKE '%FUCK%';