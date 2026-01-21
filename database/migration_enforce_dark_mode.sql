-- Migration: Enforce Dark Mode for All Users
-- Updates all existing profiles to have 'dark' as their theme_preference.
-- This ensures that even if we revert code changes later, users are on dark mode by default.

UPDATE public.profiles
SET theme_preference = 'dark';

-- Optional: You might want to set a default constraint if not already present
-- ALTER TABLE public.profiles ALTER COLUMN theme_preference SET DEFAULT 'dark';
