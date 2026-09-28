-- Storage buckets (spec section 14, stage 1 step 2). All buckets are public
-- for read (portfolios are public pages) but writes are scoped to the
-- owning user's folder, named `<user_id>/...`, enforced below.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars', 'avatars', true, 10 * 1024 * 1024),
  ('covers', 'covers', true, 10 * 1024 * 1024),
  ('screenshots', 'screenshots', true, 20 * 1024 * 1024),
  ('uploads', 'uploads', true, 500 * 1024 * 1024)
on conflict (id) do nothing;

create policy "public read on portfolio buckets"
  on storage.objects for select
  using (bucket_id in ('avatars', 'covers', 'screenshots', 'uploads'));

create policy "owners write their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owners delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owners write their own uploads"
  on storage.objects for insert
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners manage their own uploads"
  on storage.objects for update
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owners delete their own uploads"
  on storage.objects for delete
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- `covers` and `screenshots` are written exclusively by the service-role
-- ingest pipeline (Microlink fetch + server-side upload), never directly by
-- a browser session, so there are no authenticated insert/update policies
-- for them beyond the public read above.
