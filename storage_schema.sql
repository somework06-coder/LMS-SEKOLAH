-- Drop existing policies to avoid conflicts
drop policy if exists "Authenticated Upload Materials" on storage.objects;
drop policy if exists "Authenticated Delete Materials" on storage.objects;
drop policy if exists "Public Access Materials" on storage.objects;
drop policy if exists "Materials Upload" on storage.objects;

-- Ensure bucket exists
insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do nothing;

-- Policy: Allow Public Read Access
create policy "Public Access Materials"
on storage.objects for select
using ( bucket_id = 'materials' );

-- Policy: Allow Public Uploads (Fix for 500 Error / Missing Service Key)
-- This allows the server (using Anon Key) to upload files.
create policy "Materials Upload"
on storage.objects for insert
with check ( bucket_id = 'materials' );

-- Policy: Allow Public Delete (Simplified for basic teacher functionality)
create policy "Materials Delete"
on storage.objects for delete
using ( bucket_id = 'materials' );
