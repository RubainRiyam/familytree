-- End-to-end smoke test of schema, RLS and RPCs. Run by scripts/test-db.sh inside one transaction.
\set ON_ERROR_STOP on
begin;

insert into auth.users (id, phone) values
  ('00000000-0000-0000-0000-0000000000a1', '919800000001'),   -- Anand, family admin
  ('00000000-0000-0000-0000-0000000000a2', '919800000002'),   -- Leela, his wife
  ('00000000-0000-0000-0000-0000000000a3', '971500000003'),   -- Thomas, unrelated
  ('00000000-0000-0000-0000-0000000000a4', '919800000004');   -- Suma, Leela's sister

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

-- 1. Anand signs up, starts his family, adds relatives
select t.login('00000000-0000-0000-0000-0000000000a1');
select t.fails($$select register_self('Kid', null, 'male', current_date - 3650)$$, 'adults');
select register_self('Anand', 'Kizhakkethil', 'male', '1971-04-02', 'day') as anand \gset
select t.fails($$select register_self('Again', null, 'male', '1970-01-01')$$, 'already has a profile');
select create_family('Kizhakkethil Kudumbayogam', 'കിഴക്കേതിൽ കുടുംബയോഗം', 'Mavelikkara') as fam \gset
select add_relative(:'fam', :'anand', 'parent', 'Raghavan', 'Kizhakkethil', 'male', '1940-01-01', 'year', true) as father \gset
select add_relative(:'fam', :'anand', 'parent', 'Saraswathi', null, 'female', '1946-01-01', 'year') as mother \gset
select add_relative(:'fam', :'anand', 'spouse', 'Leela', null, 'female', '1975-06-11', 'day') as leela \gset
select add_relative(:'fam', :'anand', 'child', 'Meenu', 'Kizhakkethil', 'female', current_date - 4000, 'day', false, null, :'leela') as meenu \gset
select add_relative(:'fam', :'anand', 'sibling', 'Vinod', 'Kizhakkethil', 'male', '1974-01-01', 'year') as vinod \gset
do $$ begin
  assert (select count(*) from persons) = 6, 'Anand sees 6 people';
  assert (select count(*) from parent_child) = 6, 'six parent links (sibling shares both parents)';
  assert (select count(*) from family_billing where status = 'trial') = 1;
end $$;
update persons set current_city = 'Dubai', current_country = 'AE', occupation = 'Civil engineer', blood_group = 'O+' where id = :'vinod';
update persons set current_city = 'Kochi', current_country = 'IN', occupation = 'Teacher' where id = :'anand';
insert into person_contacts (person_id, phone, visibility) values (:'anand', '+919800000001', 'family');
insert into person_contacts (person_id, phone, visibility) values (:'vinod', '+971500001111', 'admins');
select t.fails(format($$insert into person_contacts (person_id, phone) values (%L, '+919811111111')$$, :'meenu'), 'under 18');
select t.fails(format($$insert into parent_child (parent_id, child_id) values (%L, %L)$$, :'meenu', :'father'), 'own ancestor');
select t.fails(format($$insert into parent_child (parent_id, child_id) values (%L, %L)$$, :'vinod', :'father'), 'ancestor');
select t.fails(format($$update persons set claimed_by = '00000000-0000-0000-0000-0000000000a3' where id = %L$$, :'vinod'), 'cannot be edited directly');

-- search by facts + kinship path
do $$ declare f uuid := (select id from families limit 1); begin
  assert (select count(*) from search_people(f, 'dubai')) = 1, 'who is in Dubai';
  assert (select given_name from search_people(f, 'enginer') limit 1) = 'Vinod', 'typo-tolerant';
  assert (select count(*) from search_people(f, p_blood => 'O+')) = 1;
  assert (select count(*) from search_people(f, p_living_only => true)) = 5;
  assert (select people from family_facets(f) where facet = 'country' and value = 'AE') = 1;
end $$;
select relation_path(:'meenu', :'vinod') as path \gset
select case when jsonb_array_length(:'path'::jsonb) = 3
            and :'path'::jsonb -> 0 ->> 'step' = 'parent' and :'path'::jsonb -> 2 ->> 'step' = 'child'
       then 'ok' else 'BAD PATH ' || :'path' end as kin \gset
select 1 / (case when :'kin' = 'ok' then 1 else 0 end) as kinship_path_ok;

insert into invites (family_id, person_id, phone) values (:'fam', :'leela', '+919800000002') returning code as invite \gset

-- 2. Thomas is a stranger: he must see nothing
select t.login('00000000-0000-0000-0000-0000000000a3');
select register_self('Thomas', 'Puthenpurayil', 'male', '1968-01-01', 'year') as thomas \gset
do $$ begin
  assert (select count(*) from persons) = 1, 'stranger sees only himself';
  assert (select count(*) from person_contacts) = 0;
  assert (select count(*) from families) = 0;
  assert (select count(*) from parent_child) = 0;
  assert (select count(*) from invites) = 0;
  assert (select count(*) from search_people((select id from family_by_code('NOPE')), 'a')) = 0;
end $$;
select t.fails(format($$select accept_invite(%L)$$, :'invite'), 'different phone');
select t.fails(format($$select add_relative(%L, %L, 'child', 'X')$$, :'fam', :'anand'), 'not a member');
select t.fails(format($$insert into family_members (family_id, person_id) values (%L, %L)$$, :'fam', :'thomas'), 'row-level security');

-- 3. Leela accepts her invite and claims the profile Anand made for her
select t.login('00000000-0000-0000-0000-0000000000a2');
select accept_invite(:'invite');
do $$ begin
  assert my_person_id() is not null, 'Leela owns a profile';
  assert (select consent_status from persons where id = my_person_id()) = 'self';
  assert (select count(*) from persons) = 6, 'Leela sees the family';
  assert (select count(*) from person_contacts) = 1, 'family-visible contact only; admins-only one is hidden';
end $$;
update persons set bio = 'hacked' where given_name = 'Anand';        -- silently affects 0 rows under RLS
do $$ begin assert (select bio from persons where given_name = 'Anand') is null, 'cannot edit someone else''s claimed profile'; end $$;
select t.fails(format($$select accept_invite(%L)$$, :'invite'), 'no longer valid');

-- 4. One person, several families: Suma starts Leela's birth family and adds "Leela" again
select t.login('00000000-0000-0000-0000-0000000000a4');
select register_self('Suma', 'Thekkedath', 'female', '1978-01-01', 'year') as suma \gset
select create_family('Thekkedath Family', null, 'Thrissur') as fam2 \gset
select add_relative(:'fam2', :'suma', 'sibling', 'Leela', 'Thekkedath', 'female') as leela_dup \gset
insert into invites (family_id, person_id) values (:'fam2', :'leela_dup') returning code as invite2 \gset
do $$ begin assert (select count(*) from persons) = 3, 'Suma, duplicate Leela, placeholder parent'; end $$;

select t.login('00000000-0000-0000-0000-0000000000a2');
select accept_invite(:'invite2');
do $$ declare me uuid := my_person_id(); begin
  assert (select count(*) from family_members where person_id = me) = 2, 'Leela is one person in two families';
  assert (select count(*) from persons where given_name = 'Leela') = 1, 'duplicate was merged away';
  assert (select house_name from persons where id = me) = 'Thekkedath', 'blank fields filled from the duplicate';
  assert (select count(*) from parent_child where child_id = me) = 1, 'she inherited the link to the shared parent';
  assert (select count(*) from persons) = 8, 'she now sees both families';
end $$;
select relation_path(:'anand', :'suma') is not null as linked \gset
select 1 / (case when :'linked'::boolean then 1 else 0 end) as families_linked_ok;

-- Anand still cannot see Suma's family beyond his wife
select t.login('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select count(*) from families) = 1;
  assert (select count(*) from persons where given_name = 'Suma') = 0, 'in-laws'' family stays private to its members';
  assert (select count(*) from person_contacts) = 2, 'admin sees admins-only contact';
end $$;
select t.fails(format($$update family_members set role = 'member' where family_id = %L and person_id = %L$$, :'fam', :'anand'), 'another owner');

-- 5. Licence rules (billing is server-written)
select t.fails($$update family_billing set member_limit = 9999$$, 'permission denied');
reset role;
update family_billing set member_limit = 6 where family_id = :'fam';
select t.login('00000000-0000-0000-0000-0000000000a1');
select t.fails(format($$select add_relative(%L, %L, 'child', 'Extra')$$, :'fam', :'anand'), 'member limit');
reset role;
update family_billing set member_limit = 300, status = 'lapsed' where family_id = :'fam';
select t.login('00000000-0000-0000-0000-0000000000a1');
select t.fails(format($$select add_relative(%L, %L, 'child', 'Extra')$$, :'fam', :'anand'), 'read-only');
do $$ begin assert (select count(*) from persons) = 6, 'a lapsed family can still read everything'; end $$;
reset role;
update family_billing set status = 'active' where family_id = :'fam';

-- 6. Erasure
select t.login('00000000-0000-0000-0000-0000000000a2');
select erase_my_data() as erased \gset
reset role;
do $$ begin
  assert (select count(*) from persons where given_name = 'Leela') = 0, 'name gone';
  assert (select count(*) from persons where given_name = 'Private member' and is_placeholder and claimed_by is null) = 1,
         'tree node kept, anonymous, so her daughter''s links survive';
  assert (select count(*) from profiles where user_id = '00000000-0000-0000-0000-0000000000a2') = 0;
end $$;
select t.login('00000000-0000-0000-0000-0000000000a3');
select erase_my_data() as erased2 \gset
reset role;
do $$ begin assert (select count(*) from persons where given_name = 'Thomas') = 0, 'unlinked profile deleted outright'; end $$;

-- 7. anon gets nothing
set local role anon;
select t.fails($$select count(*) from persons$$, 'permission denied');
reset role;

rollback;
\echo 'ALL DB TESTS PASSED'
