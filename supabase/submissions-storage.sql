-- Run once in Supabase → SQL Editor
-- Creates storage for real submission files (PDF, DOCX, etc.)

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

-- Authenticated users can upload
drop policy if exists "submissions_authenticated_upload" on storage.objects;
create policy "submissions_authenticated_upload"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'submissions');

-- Authenticated users can read (leaders + members)
drop policy if exists "submissions_authenticated_read" on storage.objects;
create policy "submissions_authenticated_read"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'submissions');
