-- Photo bucket policies from 0002_storage.sql, against the local storage stub.
\set ON_ERROR_STOP on
begin;

insert into auth.users (id, phone) values
  ('00000000-0000-0000-0000-0000000000b1', '919800000101'),   -- Anand, admin
  ('00000000-0000-0000-0000-0000000000b2', '919800000102'),   -- Leela, claims her profile
  ('00000000-0000-0000-0000-0000000000b3', '971500000103');   -- Thomas, outsider

create schema t;
create or replace function t.login(u text) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', u, true);
end $$;
create or replace function t.fails(q text, expect text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then
    if sqlerrm not ilike '%' || expect || '%' then raise exception 'wrong error for [%]: %', q, sqlerrm; end if;
    return;
  end;
  raise exception 'expected failure (%), but succeeded: %', expect, q;
end $$;
grant usage on schema t to authenticated, anon;
grant execute on all functions in schema t to authenticated, anon;

do $$ begin
  assert (select public = false from storage.buckets where id = 'photos'), 'photos bucket is private';
  assert (select file_size_limit = 2097152 from storage.buckets where id = 'photos');
end $$;

select t.login('00000000-0000-0000-0000-0000000000b1');
select register_self('Anand', 'K', 'male', '1971-04-02', 'day') as anand \gset
select create_family('Test Family') as fam \gset
select add_relative(:'fam', :'anand', 'spouse', 'Leela', null, 'female', '1975-06-11', 'day') as leela \gset
select add_relative(:'fam', :'anand', 'parent', 'Raghavan', null, 'male', '1940-01-01', 'year') as father \gset
insert into invites (family_id, person_id, phone) values (:'fam', :'leela', '+919800000102') returning code as invite \gset

-- Anand may upload his own photo and one for the unclaimed profile he added
insert into storage.objects (bucket_id, name) values ('photos', format('persons/%s/photo.jpg', :'anand'));
insert into storage.objects (bucket_id, name) values ('photos', format('persons/%s/thumb.jpg', :'father'));
select t.fails($$insert into storage.objects (bucket_id, name) values ('photos', 'elsewhere/x.jpg')$$, 'row-level security');
select t.fails($$insert into storage.objects (bucket_id, name) values ('photos', 'persons/00000000-0000-0000-0000-0000000000ff/x.jpg')$$, 'row-level security');

-- Leela claims her profile; from then on only she can change her photo
select t.login('00000000-0000-0000-0000-0000000000b2');
select accept_invite(:'invite');
insert into storage.objects (bucket_id, name) values ('photos', format('persons/%s/photo.jpg', :'leela'));
do $$ begin assert (select count(*) from storage.objects) = 3, 'Leela sees the family''s photos'; end $$;

select t.login('00000000-0000-0000-0000-0000000000b1');
select t.fails(format($$insert into storage.objects (bucket_id, name) values ('photos', 'persons/%s/thumb.jpg')$$, :'leela'), 'row-level security');
update storage.objects set metadata = '{"x":1}' where name like format('persons/%s/%%', :'leela');
delete from storage.objects where name like format('persons/%s/%%', :'leela');
do $$ begin
  assert (select count(*) from storage.objects where metadata is not null) = 0, 'Anand cannot update Leela''s photo';
  assert (select count(*) from storage.objects) = 3, 'Anand cannot delete Leela''s photo';
end $$;
delete from storage.objects where name like format('persons/%s/%%', :'father');
do $$ begin assert (select count(*) from storage.objects) = 2, 'Anand can delete the photo of a profile he keeps'; end $$;

-- An outsider sees no photos and can write none
select t.login('00000000-0000-0000-0000-0000000000b3');
do $$ begin assert (select count(*) from storage.objects) = 0, 'outsider sees no photos'; end $$;
select t.fails(format($$insert into storage.objects (bucket_id, name) values ('photos', 'persons/%s/x.jpg')$$, :'anand'), 'row-level security');

rollback;
\echo 'STORAGE TESTS PASSED'
