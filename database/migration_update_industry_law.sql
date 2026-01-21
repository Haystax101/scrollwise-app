-- Migration: Update "Creative Industries and the Arts" to "Law"

-- 1. Update the name in the industries table
UPDATE industries 
SET name = 'Law' 
WHERE name = 'Creative Industries and the Arts';

-- 2. If there are any other text-based references (e.g. in arrays in profiles), update them
-- Note: profile_passions or other JSONB fields might store raw names.

-- Example for user_industries if it stores names (it likely stores IDs, which is fine)

-- 3. If "Creative Industries and the Arts" was used as an ID/Slug, we might need more complex updates
-- But standard practice is UUID or stable integer ID.
