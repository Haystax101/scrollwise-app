-- Create 'raw-uploads' bucket for zipped batches (auto-delete after 24h)
insert into storage.buckets (id, name, public)
values ('raw-uploads', 'raw-uploads', false);

-- Set lifecycle policy for raw-uploads (requires SQL editor or dashboard usually, but we can try to document it)
-- Retain for 24 hours only.

-- Ensure 'timelapses' bucket exists for final videos
insert into storage.buckets (id, name, public)
values ('timelapses', 'timelapses', true)
on conflict (id) do nothing;

-- RLS Policies for raw-uploads
create policy "Authenticated users can upload raw batches"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'raw-uploads' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Authenticated users can read their own raw batches"
on storage.objects for select
to authenticated
using ( bucket_id = 'raw-uploads' and (storage.foldername(name))[1] = auth.uid()::text );

-- RLS Policies for timelapses
create policy "Anyone can view timelapses"
on storage.objects for select
to public
using ( bucket_id = 'timelapses' );

create policy "Authenticated users can upload final timelapses"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'timelapses' and (storage.foldername(name))[1] = auth.uid()::text );
