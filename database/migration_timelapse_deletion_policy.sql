-- Allow users to delete their own timelapses
create policy "Authenticated users can delete their own timelapses"
on storage.objects for delete
to authenticated
using ( bucket_id = 'timelapses' and (storage.foldername(name))[1] = auth.uid()::text );
