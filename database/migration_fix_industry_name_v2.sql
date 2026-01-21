-- Migration: Update "Creative Industries and the Arts" to "Law" (Robust Version)

-- 1. Update the name and slug where the name matches "Creative Industries%" (case insensitive)
UPDATE public.industries
SET name = 'Law',
    slug = 'law',
    updated_at = NOW()
WHERE name ILIKE 'Creative Industries%';

-- 2. Also ensure that if there was already a 'Law' entry, we don't end up with duplicates (optional, depending on constraints)
-- For now, we assume we are renaming the existing row.

-- 3. Update any user_industries that might have been linked? 
-- The link is by ID, so if we just updated the name of the row with that ID, the links remain valid.

-- 4. Verify the update (optional check for the user to run)
SELECT * FROM public.industries WHERE name = 'Law';
