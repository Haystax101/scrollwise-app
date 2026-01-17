-- Create the storage bucket for community media
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-media', 'community-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for community-media

-- Allow public read access (assuming posts are public/visible to members, but keeping media public simplifies things for now like avatars)
CREATE POLICY "Community Media is publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'community-media' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload community media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'community-media' 
    AND auth.role() = 'authenticated'
);

-- Allow users to update/delete their own files (optional, but good practice)
CREATE POLICY "Users can update their own community media"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'community-media' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own community media"
ON storage.objects FOR DELETE
USING ( bucket_id = 'community-media' AND owner = auth.uid() );
