-- Script to remove inappropriate quiz questions containing "FUCK" in option_d
-- This should be run as a database administrator

BEGIN;

-- First, let's see what we're about to delete (for logging purposes)
SELECT 
    id, 
    question, 
    option_d,
    content_type,
    content_id,
    created_at
FROM quiz_questions 
WHERE UPPER(option_d) LIKE '%FUCK%';

-- Delete any quiz attempts that reference these inappropriate questions first
-- (to maintain referential integrity)
DELETE FROM quiz_attempts 
WHERE question_id IN (
    SELECT id 
    FROM quiz_questions 
    WHERE UPPER(option_d) LIKE '%FUCK%'
);

-- Now delete the inappropriate quiz questions
DELETE FROM quiz_questions 
WHERE UPPER(option_d) LIKE '%FUCK%';

-- Report how many records were affected
SELECT 
    'Cleanup completed' as status,
    (SELECT COUNT(*) FROM quiz_questions WHERE UPPER(option_d) LIKE '%FUCK%') as remaining_inappropriate_questions;

COMMIT;

-- Optional: Run this query to verify the cleanup worked
-- SELECT COUNT(*) as total_questions FROM quiz_questions;
-- SELECT COUNT(*) as inappropriate_questions FROM quiz_questions WHERE UPPER(option_d) LIKE '%FUCK%';