alter table public.users
add column if not exists contact_number text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rtask-avatars',
  'rtask-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_select_public" on storage.objects
for select using (bucket_id = 'rtask-avatars');

create policy "avatars_insert_own_folder" on storage.objects
for insert to authenticated with check (
  bucket_id = 'rtask-avatars'
  and coalesce((storage.foldername(name))[1], '') = auth.uid()::text
);

create policy "avatars_update_own_folder" on storage.objects
for update to authenticated using (
  bucket_id = 'rtask-avatars'
  and coalesce((storage.foldername(name))[1], '') = auth.uid()::text
)
with check (
  bucket_id = 'rtask-avatars'
  and coalesce((storage.foldername(name))[1], '') = auth.uid()::text
);

create policy "avatars_delete_own_folder" on storage.objects
for delete to authenticated using (
  bucket_id = 'rtask-avatars'
  and coalesce((storage.foldername(name))[1], '') = auth.uid()::text
);
