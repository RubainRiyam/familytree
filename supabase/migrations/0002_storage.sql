-- Profile photos. NOT covered by scripts/test-db.sh (needs Supabase's storage schema):
-- apply to the Supabase project and verify by hand, then add a test.
-- Object path convention:  persons/<person_id>/<file>.jpg   and   persons/<person_id>/thumb.jpg

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 2097152, array['image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy photos_read on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = 'persons'
         and public.can_see_person(((storage.foldername(name))[2])::uuid));

create policy photos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = 'persons'
              and public.can_edit_person(((storage.foldername(name))[2])::uuid));

create policy photos_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.can_edit_person(((storage.foldername(name))[2])::uuid));

create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.can_edit_person(((storage.foldername(name))[2])::uuid));
