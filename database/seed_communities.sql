-- Seed Communities
INSERT INTO public.communities (name, description, privacy_level, slug)
VALUES 
('React Native Developers', 'A community for RN enthusiasts building cool apps.', 'public', 'react-native'),
('Design Systems', 'Talking about Figma, Tokens, and UI/UX.', 'public', 'design-systems'),
('Startup Founders', 'Building the next unicorn.', 'public', 'startups')
ON CONFLICT (slug) DO NOTHING;

-- Seed Members (Add current user to all public communities for testing)
-- Note: Replace 'auth.uid()' with actual user ID if running manually, or run as authenticated user in dashboard.
-- For this script, we'll try to insert for all users.
INSERT INTO public.community_members (community_id, user_id, role)
SELECT c.id, u.id, 'member'
FROM public.communities c, auth.users u
WHERE c.privacy_level = 'public'
ON CONFLICT DO NOTHING;
