-- Aalthara — core schema, row-level security and RPCs
-- Target: Supabase Postgres 15+ (tested on Postgres 16).
-- Conventions: text + CHECK instead of enums (cheap to evolve), every table has RLS on,
-- every write that spans tables goes through a SECURITY DEFINER function that checks rights itself.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- ───────────────────────────── tables ─────────────────────────────

-- One row per human being, alive or not, with or without an account.
-- A person is global: the same row is shared by every family they belong to.
create table public.persons (
  id               uuid primary key default gen_random_uuid(),
  given_name       text not null check (char_length(given_name) between 1 and 80),
  house_name       text check (char_length(house_name) <= 80),      -- veettuperu / surname
  name_ml          text check (char_length(name_ml) <= 120),        -- name in Malayalam script
  nickname         text check (char_length(nickname) <= 60),        -- vilipperu
  gender           text not null default 'unknown' check (gender in ('female','male','other','unknown')),
  birth_date       date,
  birth_precision  text not null default 'unknown' check (birth_precision in ('day','month','year','unknown')),
  is_deceased      boolean not null default false,
  death_date       date,
  blood_group      text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  occupation       text check (char_length(occupation) <= 120),
  employer         text check (char_length(employer) <= 120),
  education        text check (char_length(education) <= 160),
  current_city     text check (char_length(current_city) <= 80),
  current_region   text check (char_length(current_region) <= 80),
  current_country  text check (current_country ~ '^[A-Z]{2}$'),     -- ISO 3166-1 alpha-2
  native_place     text check (char_length(native_place) <= 120),
  bio              text check (char_length(bio) <= 2000),
  photo_path       text,
  is_placeholder   boolean not null default false,                  -- "unknown parent" or an erased member
  -- Who said this profile may exist. self = the person; guardian = a parent, for a minor;
  -- attested = a family admin holds the person's consent (e.g. a signed membership form);
  -- pending = added by a relative, not yet confirmed; not_required = deceased / placeholder.
  consent_status   text not null default 'pending'
                   check (consent_status in ('self','guardian','attested','pending','not_required')),
  consent_note     text check (char_length(consent_note) <= 300),
  claimed_by       uuid unique references auth.users(id) on delete set null,  -- one account ⇄ one person
  created_by       uuid default auth.uid() references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  search_text      text generated always as (
    lower(
      coalesce(given_name,'') || ' ' || coalesce(house_name,'') || ' ' || coalesce(name_ml,'') || ' ' ||
      coalesce(nickname,'') || ' ' || coalesce(occupation,'') || ' ' || coalesce(employer,'') || ' ' ||
      coalesce(education,'') || ' ' || coalesce(current_city,'') || ' ' || coalesce(current_region,'') || ' ' ||
      coalesce(native_place,'')
    )
  ) stored,
  check (death_date is null or is_deceased),
  check (birth_date is null or death_date is null or death_date >= birth_date)
);
create index persons_search_trgm on public.persons using gin (search_text extensions.gin_trgm_ops);
create index persons_place on public.persons (current_country, current_city);
create index persons_blood on public.persons (blood_group) where blood_group is not null;
create index persons_updated on public.persons (updated_at);
create index persons_created_by on public.persons (created_by);

-- Contact details live apart from the profile so they can have stricter visibility.
create table public.person_contacts (
  person_id    uuid primary key references public.persons(id) on delete cascade,
  phone        text check (phone ~ '^\+[1-9][0-9]{6,14}$'),         -- E.164
  whatsapp     text check (whatsapp ~ '^\+[1-9][0-9]{6,14}$'),
  email        text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  address      text check (char_length(address) <= 400),
  postal_code  text check (char_length(postal_code) <= 12),
  visibility   text not null default 'family' check (visibility in ('family','admins','hidden')),
  updated_at   timestamptz not null default now()
);

create table public.profiles (                                      -- per-account settings
  user_id      uuid primary key references auth.users(id) on delete cascade,
  locale       text not null default 'ml' check (locale in ('ml','en')),
  text_scale   numeric(3,2) not null default 1.00 check (text_scale between 1.00 and 1.60),
  notify_birthdays boolean not null default true,
  notify_events    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.families (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 2 and 120),
  name_ml          text check (char_length(name_ml) <= 160),
  origin_place     text check (char_length(origin_place) <= 120),
  about            text check (char_length(about) <= 4000),
  join_code        text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  member_additions text not null default 'open' check (member_additions in ('open','approval')),
  created_by       uuid default auth.uid() references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Billing state. Written only by the server (payment webhook) with the service role.
create table public.family_billing (
  family_id       uuid primary key references public.families(id) on delete cascade,
  plan            text not null default 'trial' check (plan in ('trial','kudumbam','tharavadu','custom')),
  status          text not null default 'trial' check (status in ('trial','active','grace','lapsed')),
  member_limit    integer not null default 50 check (member_limit > 0),
  trial_ends_on   date not null default (current_date + 30),
  licence_paid_at timestamptz,
  renews_on       date
);

create table public.branches (                                      -- thaivazhi / shakha / house within a family
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  name_ml    text,
  color      text not null default 'vazha' check (color in ('chethi','vazha','kayal','mazha','chakka','kadalas')),
  sort_order integer not null default 0,
  unique (family_id, name)
);

create table public.family_members (
  family_id  uuid not null references public.families(id) on delete cascade,
  person_id  uuid not null references public.persons(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner','admin','editor','member')),
  status     text not null default 'active' check (status in ('active','pending')),
  branch_id  uuid references public.branches(id) on delete set null,
  joined_via text not null default 'birth' check (joined_via in ('birth','marriage','adoption','other')),
  member_no  text,
  added_by   uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (family_id, person_id)
);
create index family_members_person on public.family_members (person_id);

-- Relationships: only two primitives are stored. Everything else (siblings, cousins,
-- in-laws, ammavan, valyamma …) is derived from these.
create table public.parent_child (
  parent_id  uuid not null references public.persons(id) on delete cascade,
  child_id   uuid not null references public.persons(id) on delete cascade,
  kind       text not null default 'biological' check (kind in ('biological','adoptive','step','foster','guardian')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (parent_id, child_id),
  check (parent_id <> child_id)
);
create index parent_child_child on public.parent_child (child_id);

create table public.partnerships (
  person_a   uuid not null references public.persons(id) on delete cascade,
  person_b   uuid not null references public.persons(id) on delete cascade,
  kind       text not null default 'marriage' check (kind in ('marriage','engagement','partner')),
  status     text not null default 'current' check (status in ('current','widowed','divorced','separated')),
  start_date date,
  end_date   date,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (person_a, person_b),
  check (person_a < person_b)                                       -- canonical order, one row per couple
);
create index partnerships_b on public.partnerships (person_b);

create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  person_id   uuid references public.persons(id) on delete cascade, -- the profile this invite lets someone claim
  phone       text check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  code        text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  role        text not null default 'member' check (role in ('admin','editor','member')),
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '30 days'),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz
);
create index invites_family on public.invites (family_id);

create table public.join_requests (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note       text check (char_length(note) <= 500),                 -- "I am Leela's younger son"
  status     text not null default 'pending' check (status in ('pending','approved','declined')),
  decided_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table public.events (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  kind       text not null default 'meet' check (kind in ('meet','wedding','housewarming','memorial','notice','other')),
  title      text not null check (char_length(title) between 1 and 160),
  body       text check (char_length(body) <= 4000),
  place      text check (char_length(place) <= 200),
  starts_at  timestamptz,
  pinned     boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index events_family_time on public.events (family_id, starts_at);

create table public.event_rsvps (
  event_id   uuid not null references public.events(id) on delete cascade,
  person_id  uuid not null references public.persons(id) on delete cascade,
  answer     text not null check (answer in ('yes','no','maybe')),
  headcount  integer not null default 1 check (headcount between 0 and 30),
  updated_at timestamptz not null default now(),
  primary key (event_id, person_id)
);

-- Compliance records (DPDP Act 2023): what was agreed to, and every rights request.
create table public.consents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  purpose       text not null check (purpose in ('account','directory_listing','contact_sharing','notifications','child_profile')),
  subject_person uuid references public.persons(id) on delete cascade, -- the child, for child_profile
  notice_version text not null,
  granted_at    timestamptz not null default now(),
  withdrawn_at  timestamptz
);
create index consents_user on public.consents (user_id);

create table public.data_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid default auth.uid() references auth.users(id) on delete set null,
  kind        text not null check (kind in ('access','correction','erasure','grievance','nomination')),
  details     text check (char_length(details) <= 4000),
  status      text not null default 'open' check (status in ('open','in_progress','resolved','rejected')),
  created_at  timestamptz not null default now(),
  due_at      timestamptz not null default (now() + interval '90 days'),
  resolved_at timestamptz
);

create table public.payments (                                      -- server-written ledger
  id                  uuid primary key default gen_random_uuid(),
  family_id           uuid not null references public.families(id) on delete restrict,
  kind                text not null check (kind in ('licence','renewal')),
  amount_paise        integer not null check (amount_paise >= 0),
  currency            text not null default 'INR',
  provider            text not null default 'razorpay',
  provider_order_id   text unique,
  provider_payment_id text unique,
  status              text not null default 'created' check (status in ('created','paid','failed','refunded')),
  period_start        date,
  period_end          date,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);

create table public.audit_log (
  id         bigint generated always as identity primary key,
  family_id  uuid references public.families(id) on delete cascade,
  actor      uuid,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  at         timestamptz not null default now()
);
create index audit_family_at on public.audit_log (family_id, at desc);

-- Deletions, so offline devices can drop rows on the next sync.
create table public.tombstones (
  id         bigint generated always as identity primary key,
  entity     text not null,
  entity_id  uuid not null,
  family_id  uuid,
  deleted_at timestamptz not null default now()
);
create index tombstones_family_at on public.tombstones (family_id, deleted_at);

-- ───────────────────────────── helpers ─────────────────────────────
-- SECURITY DEFINER so policies can ask membership questions without recursing into RLS.

create or replace function public.my_person_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from persons where claimed_by = auth.uid()
$$;

create or replace function public.family_role(fid uuid) returns text
language sql stable security definer set search_path = public as $$
  select fm.role from family_members fm join persons p on p.id = fm.person_id
  where fm.family_id = fid and fm.status = 'active' and p.claimed_by = auth.uid()
$$;

create or replace function public.is_family_member(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.family_role(fid) is not null
$$;

create or replace function public.family_writable(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status in ('trial','active','grace') from family_billing where family_id = fid), false)
$$;

create or replace function public.can_edit_family(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.family_role(fid) in ('owner','admin','editor') and public.family_writable(fid)
$$;

create or replace function public.is_family_admin(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.family_role(fid) in ('owner','admin'), false)
$$;

-- Do I share at least one family with this person?
create or replace function public.shares_family_with(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from family_members theirs
    join family_members mine on mine.family_id = theirs.family_id and mine.status = 'active'
    join persons me on me.id = mine.person_id and me.claimed_by = auth.uid()
    where theirs.person_id = pid
  )
$$;

create or replace function public.is_admin_over(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from family_members theirs
    join family_members mine on mine.family_id = theirs.family_id and mine.status = 'active'
                            and mine.role in ('owner','admin')
    join persons me on me.id = mine.person_id and me.claimed_by = auth.uid()
    where theirs.person_id = pid
  )
$$;

create or replace function public.can_see_person(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from persons p where p.id = pid
                 and (p.claimed_by = auth.uid() or p.created_by = auth.uid()))
      or public.shares_family_with(pid)
$$;

-- A claimed profile belongs to its owner alone. An unclaimed one can be kept up by
-- whoever added it, by a parent, or by an editor/admin of a family it is in.
create or replace function public.can_edit_person(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from persons p where p.id = pid and (
      p.claimed_by = auth.uid()
      or (p.claimed_by is null and (
            p.created_by = auth.uid()
            or exists (select 1 from parent_child pc where pc.child_id = p.id and pc.parent_id = public.my_person_id())
            or exists (select 1 from family_members fm where fm.person_id = p.id and public.can_edit_family(fm.family_id))
      ))
    )
  )
$$;

create or replace function public.is_minor(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select birth_date > (current_date - interval '18 years')::date and not is_deceased
                   from persons where id = pid), false)
$$;

-- ───────────────────────────── triggers ─────────────────────────────

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

create trigger persons_touch  before update on public.persons         for each row execute function public.touch_updated_at();
create trigger contacts_touch before update on public.person_contacts for each row execute function public.touch_updated_at();
create trigger families_touch before update on public.families        for each row execute function public.touch_updated_at();

-- claimed_by / created_by change only through the RPCs below.
create or replace function public.guard_person_columns() returns trigger
language plpgsql as $$
begin
  -- Inside the SECURITY DEFINER RPCs current_user is the function owner; direct client writes arrive as 'authenticated'.
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if tg_op = 'INSERT' then
    if new.claimed_by is not null then raise exception 'claim a profile through register_self or accept_invite'; end if;
    new.created_by := auth.uid();
  else
    if new.claimed_by is distinct from old.claimed_by or new.created_by is distinct from old.created_by then
      raise exception 'claimed_by and created_by cannot be edited directly';
    end if;
  end if;
  return new;
end $$;
create trigger persons_guard before insert or update on public.persons
  for each row execute function public.guard_person_columns();

-- No contact details for a minor (DPDP Act s.9: children's data needs verifiable parental consent;
-- v1 simply does not hold a child's contact details).
create or replace function public.guard_minor_contact() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_minor(new.person_id) then
    raise exception 'contact details cannot be stored for a person under 18';
  end if;
  return new;
end $$;
create trigger contacts_minor before insert or update on public.person_contacts
  for each row execute function public.guard_minor_contact();

-- A person cannot be their own ancestor, and a parent cannot be younger than a child.
create or replace function public.guard_parent_child() returns trigger
language plpgsql security definer set search_path = public as $$
declare pb date; cb date;
begin
  if exists (
    with recursive down(id) as (
      select child_id from parent_child where parent_id = new.child_id
      union
      select pc.child_id from parent_child pc join down d on pc.parent_id = d.id
    ) select 1 from down where id = new.parent_id
  ) then
    raise exception 'this link would make a person their own ancestor';
  end if;
  select birth_date into pb from persons where id = new.parent_id;
  select birth_date into cb from persons where id = new.child_id;
  if pb is not null and cb is not null and new.kind = 'biological' and pb >= cb then
    raise exception 'a parent must be born before their child';
  end if;
  return new;
end $$;
create trigger parent_child_guard before insert or update on public.parent_child
  for each row execute function public.guard_parent_child();

-- A family always keeps one owner, and stays within its licence.
create or replace function public.guard_family_members() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim integer; n integer;
begin
  if tg_op in ('UPDATE','DELETE') and old.role = 'owner' and old.status = 'active'
     and (tg_op = 'DELETE' or new.role <> 'owner' or new.status <> 'active')
     and exists (select 1 from families where id = old.family_id)
     and not exists (select 1 from family_members where family_id = old.family_id and role = 'owner'
                     and status = 'active' and person_id <> old.person_id)
     and exists (select 1 from family_members where family_id = old.family_id and person_id <> old.person_id)
  then
    raise exception 'hand the family over to another owner first';
  end if;
  if tg_op = 'INSERT' then
    select member_limit into lim from family_billing where family_id = new.family_id;
    select count(*) into n from family_members where family_id = new.family_id;
    if lim is not null and n >= lim then
      raise exception 'member limit reached for this family (%). Upgrade the licence to add more.', lim
        using errcode = 'P0001', hint = 'member_limit';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger family_members_guard before insert or update or delete on public.family_members
  for each row execute function public.guard_family_members();

create or replace function public.log_membership() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from families where id = old.family_id) then
      insert into audit_log(family_id, actor, action, entity, entity_id)
        values (old.family_id, auth.uid(), 'member.removed', 'person', old.person_id);
      insert into tombstones(entity, entity_id, family_id) values ('family_member', old.person_id, old.family_id);
    end if;
    return old;
  end if;
  insert into audit_log(family_id, actor, action, entity, entity_id)
    values (new.family_id, auth.uid(), case tg_op when 'INSERT' then 'member.added' else 'member.changed' end,
            'person', new.person_id);
  return new;
end $$;
create trigger family_members_log after insert or update or delete on public.family_members
  for each row execute function public.log_membership();

-- ───────────────────────────── row-level security ─────────────────────────────

alter table public.persons         enable row level security;
alter table public.person_contacts enable row level security;
alter table public.profiles        enable row level security;
alter table public.families        enable row level security;
alter table public.family_billing  enable row level security;
alter table public.branches        enable row level security;
alter table public.family_members  enable row level security;
alter table public.parent_child    enable row level security;
alter table public.partnerships    enable row level security;
alter table public.invites         enable row level security;
alter table public.join_requests   enable row level security;
alter table public.events          enable row level security;
alter table public.event_rsvps     enable row level security;
alter table public.consents        enable row level security;
alter table public.data_requests   enable row level security;
alter table public.payments        enable row level security;
alter table public.audit_log       enable row level security;
alter table public.tombstones      enable row level security;

-- persons
create policy persons_select on public.persons for select to authenticated
  using (claimed_by = (select auth.uid()) or created_by = (select auth.uid()) or public.shares_family_with(id));
create policy persons_insert on public.persons for insert to authenticated
  with check (claimed_by is null);
create policy persons_update on public.persons for update to authenticated
  using (public.can_edit_person(id)) with check (public.can_edit_person(id));
create policy persons_delete on public.persons for delete to authenticated
  using (claimed_by is null and (created_by = (select auth.uid()) or public.is_admin_over(id)));

-- person_contacts
create policy contacts_select on public.person_contacts for select to authenticated
  using (
    public.can_edit_person(person_id)
    or (visibility = 'family' and public.shares_family_with(person_id))
    or (visibility = 'admins' and public.is_admin_over(person_id))
  );
create policy contacts_write on public.person_contacts for all to authenticated
  using (public.can_edit_person(person_id)) with check (public.can_edit_person(person_id));

-- profiles
create policy profiles_own on public.profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- families (created through create_family)
create policy families_select on public.families for select to authenticated
  using (public.is_family_member(id));
create policy families_update on public.families for update to authenticated
  using (public.is_family_admin(id)) with check (public.is_family_admin(id));
create policy families_delete on public.families for delete to authenticated
  using (public.family_role(id) = 'owner');

create policy billing_select on public.family_billing for select to authenticated
  using (public.is_family_member(family_id));

create policy branches_select on public.branches for select to authenticated
  using (public.is_family_member(family_id));
create policy branches_write on public.branches for all to authenticated
  using (public.can_edit_family(family_id)) with check (public.can_edit_family(family_id));

-- family_members
create policy members_select on public.family_members for select to authenticated
  using (public.is_family_member(family_id) or person_id = public.my_person_id());
create policy members_insert on public.family_members for insert to authenticated
  with check (public.can_edit_family(family_id) and role <> 'owner' and public.can_see_person(person_id));
create policy members_update on public.family_members for update to authenticated
  using (public.is_family_admin(family_id))
  with check (public.is_family_admin(family_id) and (role <> 'owner' or public.family_role(family_id) = 'owner'));
create policy members_delete on public.family_members for delete to authenticated
  using (public.is_family_admin(family_id) or person_id = public.my_person_id());

-- relationships: visible if either end is visible; writable if you may edit either end
-- (or one end is you) and you can see both.
create policy parent_child_select on public.parent_child for select to authenticated
  using (public.can_see_person(parent_id) or public.can_see_person(child_id));
create policy parent_child_insert on public.parent_child for insert to authenticated
  with check (public.can_see_person(parent_id) and public.can_see_person(child_id)
              and (public.can_edit_person(parent_id) or public.can_edit_person(child_id)));
create policy parent_child_update on public.parent_child for update to authenticated
  using (public.can_edit_person(parent_id) or public.can_edit_person(child_id))
  with check (public.can_see_person(parent_id) and public.can_see_person(child_id));
create policy parent_child_delete on public.parent_child for delete to authenticated
  using (public.can_edit_person(parent_id) or public.can_edit_person(child_id));

create policy partnerships_select on public.partnerships for select to authenticated
  using (public.can_see_person(person_a) or public.can_see_person(person_b));
create policy partnerships_insert on public.partnerships for insert to authenticated
  with check (public.can_see_person(person_a) and public.can_see_person(person_b)
              and (public.can_edit_person(person_a) or public.can_edit_person(person_b)));
create policy partnerships_update on public.partnerships for update to authenticated
  using (public.can_edit_person(person_a) or public.can_edit_person(person_b))
  with check (public.can_see_person(person_a) and public.can_see_person(person_b));
create policy partnerships_delete on public.partnerships for delete to authenticated
  using (public.can_edit_person(person_a) or public.can_edit_person(person_b));

-- invites: any member may invite a relative as a plain member; editors+ may grant roles.
create policy invites_select on public.invites for select to authenticated
  using (created_by = (select auth.uid()) or public.is_family_admin(family_id));
create policy invites_insert on public.invites for insert to authenticated
  with check (public.is_family_member(family_id) and public.family_writable(family_id)
              and (role = 'member' or public.is_family_admin(family_id)));
create policy invites_delete on public.invites for delete to authenticated
  using (created_by = (select auth.uid()) or public.is_family_admin(family_id));

create policy join_requests_select on public.join_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_family_admin(family_id));
create policy join_requests_delete on public.join_requests for delete to authenticated
  using (user_id = (select auth.uid()));

create policy events_select on public.events for select to authenticated
  using (public.is_family_member(family_id));
create policy events_write on public.events for all to authenticated
  using (public.can_edit_family(family_id)) with check (public.can_edit_family(family_id));

create policy rsvps_select on public.event_rsvps for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and public.is_family_member(e.family_id)));
create policy rsvps_write on public.event_rsvps for all to authenticated
  using (person_id = public.my_person_id())
  with check (person_id = public.my_person_id()
              and exists (select 1 from public.events e where e.id = event_id and public.is_family_member(e.family_id)));

create policy consents_select on public.consents for select to authenticated using (user_id = (select auth.uid()));
create policy consents_insert on public.consents for insert to authenticated with check (user_id = (select auth.uid()));
create policy consents_withdraw on public.consents for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy data_requests_select on public.data_requests for select to authenticated using (user_id = (select auth.uid()));
create policy data_requests_insert on public.data_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'open');

create policy payments_select on public.payments for select to authenticated using (public.is_family_admin(family_id));
create policy audit_select on public.audit_log for select to authenticated using (public.is_family_admin(family_id));
create policy tombstones_select on public.tombstones for select to authenticated using (public.is_family_member(family_id));

-- ───────────────────────────── RPCs ─────────────────────────────

-- First step after sign-in: create (and claim) your own profile. Adults only.
create or replace function public.register_self(
  p_given_name text, p_house_name text default null, p_gender text default 'unknown',
  p_birth_date date default null, p_birth_precision text default 'year', p_notice_version text default 'v1'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pid uuid;
begin
  if uid is null then raise exception 'sign in first'; end if;
  if public.my_person_id() is not null then raise exception 'this account already has a profile'; end if;
  if p_birth_date is null then raise exception 'year of birth is required'; end if;
  if p_birth_date > (current_date - interval '18 years')::date then
    raise exception 'accounts are for adults (18+); a parent can add a child to the family';
  end if;
  insert into persons (given_name, house_name, gender, birth_date, birth_precision, consent_status, claimed_by, created_by)
    values (p_given_name, p_house_name, p_gender, p_birth_date, p_birth_precision, 'self', uid, uid)
    returning id into pid;
  insert into profiles (user_id) values (uid) on conflict do nothing;
  insert into consents (user_id, purpose, notice_version) values (uid, 'account', p_notice_version);
  return pid;
end $$;

create or replace function public.create_family(p_name text, p_name_ml text default null, p_origin_place text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := public.my_person_id(); fid uuid;
begin
  if me is null then raise exception 'create your own profile first'; end if;
  insert into families (name, name_ml, origin_place, created_by) values (p_name, p_name_ml, p_origin_place, auth.uid())
    returning id into fid;
  insert into family_billing (family_id) values (fid);
  insert into family_members (family_id, person_id, role, status, added_by) values (fid, me, 'owner', 'active', auth.uid());
  return fid;
end $$;

-- Add a relative of someone already in the family, in one step.
-- p_relation: parent | child | spouse | sibling   (of p_anchor)
create or replace function public.add_relative(
  p_family uuid, p_anchor uuid, p_relation text, p_given_name text,
  p_house_name text default null, p_gender text default 'unknown',
  p_birth_date date default null, p_birth_precision text default 'unknown',
  p_is_deceased boolean default false, p_kind text default null, p_other_parent uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); pid uuid; ph uuid; par record; st text; additions text; had_parent boolean := false;
begin
  if uid is null or not public.is_family_member(p_family) then raise exception 'you are not a member of this family'; end if;
  if not public.family_writable(p_family) then
    raise exception 'this family is read-only until its licence is renewed' using hint = 'licence';
  end if;
  if p_relation not in ('parent','child','spouse','sibling') then raise exception 'unknown relation %', p_relation; end if;
  if not exists (select 1 from family_members where family_id = p_family and person_id = p_anchor) then
    raise exception 'that person is not in this family';
  end if;
  select member_additions into additions from families where id = p_family;
  st := case when additions = 'open' or public.can_edit_family(p_family) then 'active' else 'pending' end;
  insert into persons (given_name, house_name, gender, birth_date, birth_precision, is_deceased, consent_status, created_by)
    values (p_given_name, p_house_name, p_gender, p_birth_date,
            case when p_birth_date is null then 'unknown' else p_birth_precision end, p_is_deceased,
            case when p_is_deceased then 'not_required' else 'pending' end, uid)
    returning id into pid;

  insert into family_members (family_id, person_id, role, status, joined_via, added_by)
    values (p_family, pid, 'member', st, case when p_relation = 'spouse' then 'marriage' else 'birth' end, uid);

  if p_relation = 'parent' then
    insert into parent_child (parent_id, child_id, kind, created_by) values (pid, p_anchor, coalesce(p_kind,'biological'), uid);
  elsif p_relation = 'child' then
    insert into parent_child (parent_id, child_id, kind, created_by) values (p_anchor, pid, coalesce(p_kind,'biological'), uid);
    if p_other_parent is not null then
      if not public.can_see_person(p_other_parent) then raise exception 'other parent not found'; end if;
      insert into parent_child (parent_id, child_id, kind, created_by) values (p_other_parent, pid, coalesce(p_kind,'biological'), uid);
    end if;
  elsif p_relation = 'spouse' then
    insert into partnerships (person_a, person_b, kind, created_by)
      values (least(p_anchor, pid), greatest(p_anchor, pid), coalesce(p_kind,'marriage'), uid);
  else -- sibling: share the anchor's parents; if none are recorded yet, hang both on a placeholder parent
    for par in select parent_id, kind from parent_child where child_id = p_anchor loop
      had_parent := true;
      insert into parent_child (parent_id, child_id, kind, created_by) values (par.parent_id, pid, par.kind, uid);
    end loop;
    if not had_parent then
      insert into persons (given_name, is_placeholder, consent_status, created_by)
        values ('Parent', true, 'not_required', uid) returning id into ph;
      insert into family_members (family_id, person_id, role, status, added_by) values (p_family, ph, 'member', st, uid);
      insert into parent_child (parent_id, child_id, created_by) values (ph, p_anchor, uid), (ph, pid, uid);
    end if;
  end if;
  return pid;
end $$;

-- Fold a duplicate (unclaimed) profile into another. Internal: not granted to clients.
create or replace function public.merge_persons_internal(p_keep uuid, p_drop uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_keep = p_drop then return; end if;
  if (select claimed_by from persons where id = p_drop) is not null then
    raise exception 'a claimed profile cannot be merged away';
  end if;

  delete from parent_child where (parent_id = p_keep and child_id = p_drop) or (parent_id = p_drop and child_id = p_keep);
  insert into parent_child (parent_id, child_id, kind, created_by)
    select p_keep, child_id, kind, created_by from parent_child where parent_id = p_drop on conflict do nothing;
  insert into parent_child (parent_id, child_id, kind, created_by)
    select parent_id, p_keep, kind, created_by from parent_child where child_id = p_drop on conflict do nothing;
  delete from parent_child where p_drop in (parent_id, child_id);

  insert into partnerships (person_a, person_b, kind, status, start_date, end_date, created_by)
    select least(p_keep, o.other), greatest(p_keep, o.other), o.kind, o.status, o.start_date, o.end_date, o.created_by
    from (select case when person_a = p_drop then person_b else person_a end as other, *
          from partnerships where p_drop in (person_a, person_b)) o
    where o.other <> p_keep
    on conflict do nothing;
  delete from partnerships where p_drop in (person_a, person_b);

  insert into family_members (family_id, person_id, role, status, branch_id, joined_via, member_no, added_by)
    select family_id, p_keep, role, status, branch_id, joined_via, member_no, added_by
    from family_members where person_id = p_drop
    on conflict (family_id, person_id) do nothing;
  delete from family_members where person_id = p_drop;

  update event_rsvps set person_id = p_keep where person_id = p_drop
    and not exists (select 1 from event_rsvps r where r.event_id = event_rsvps.event_id and r.person_id = p_keep);

  update persons k set
    house_name = coalesce(k.house_name, d.house_name), name_ml = coalesce(k.name_ml, d.name_ml),
    nickname = coalesce(k.nickname, d.nickname),
    gender = case when k.gender = 'unknown' then d.gender else k.gender end,
    native_place = coalesce(k.native_place, d.native_place), photo_path = coalesce(k.photo_path, d.photo_path)
  from persons d where k.id = p_keep and d.id = p_drop;

  delete from persons where id = p_drop;
end $$;

-- Accept an invite. Three cases:
--  1. new account, invite points at a profile  → claim that profile
--  2. existing account, invite points at a profile → that profile is you in another family: merge it into yours
--  3. invite without a profile → just join (profile must exist already)
create or replace function public.accept_invite(p_code text) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); inv invites%rowtype; me uuid; my_phone text;
begin
  if uid is null then raise exception 'sign in first'; end if;
  select * into inv from invites where code = upper(trim(p_code)) for update;
  if not found or inv.accepted_at is not null or inv.expires_at < now() then
    raise exception 'this invite is no longer valid';
  end if;
  if inv.phone is not null then
    select regexp_replace(coalesce(phone,''), '\D', '', 'g') into my_phone from auth.users where id = uid;
    if my_phone <> regexp_replace(inv.phone, '\D', '', 'g') then
      raise exception 'this invite was sent to a different phone number';
    end if;
  end if;
  me := public.my_person_id();

  if inv.person_id is not null then
    if (select claimed_by from persons where id = inv.person_id) is not null and inv.person_id is distinct from me then
      raise exception 'this profile already belongs to someone';
    end if;
    if public.is_minor(inv.person_id) then raise exception 'accounts are for adults (18+)'; end if;
    if me is null then
      update persons set claimed_by = uid, consent_status = 'self' where id = inv.person_id;
      insert into profiles (user_id) values (uid) on conflict do nothing;
      insert into consents (user_id, purpose, notice_version) values (uid, 'account', 'v1');
      me := inv.person_id;
    elsif me <> inv.person_id then
      perform public.merge_persons_internal(me, inv.person_id);
    end if;
  elsif me is null then
    raise exception 'create your own profile first';
  end if;

  insert into family_members (family_id, person_id, role, status, added_by)
    values (inv.family_id, me, inv.role, 'active', inv.created_by)
    on conflict (family_id, person_id) do update set status = 'active',
      role = case when family_members.role = 'owner' then 'owner' else excluded.role end;
  update invites set accepted_by = uid, accepted_at = now() where id = inv.id;
  return inv.family_id;
end $$;

-- Joining with the family code printed on a notice / shared on WhatsApp: needs an admin's yes.
create or replace function public.family_by_code(p_code text)
returns table (id uuid, name text, name_ml text, origin_place text)
language sql stable security definer set search_path = public as $$
  select f.id, f.name, f.name_ml, f.origin_place from families f where f.join_code = upper(trim(p_code))
$$;

create or replace function public.request_join(p_code text, p_note text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid; rid uuid;
begin
  if public.my_person_id() is null then raise exception 'create your own profile first'; end if;
  select id into fid from families where join_code = upper(trim(p_code));
  if fid is null then raise exception 'no family uses that code'; end if;
  insert into join_requests (family_id, user_id, note) values (fid, auth.uid(), p_note)
    on conflict (family_id, user_id) do update set note = excluded.note, status = 'pending'
    returning id into rid;
  return rid;
end $$;

-- p_merge_into: the unclaimed profile in this family that is the requester, if an admin spots one.
create or replace function public.decide_join_request(p_request uuid, p_approve boolean, p_existing_profile uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare jr join_requests%rowtype; them uuid;
begin
  select * into jr from join_requests where id = p_request for update;
  if not found or not public.is_family_admin(jr.family_id) then raise exception 'not allowed'; end if;
  if jr.status <> 'pending' then raise exception 'already decided'; end if;
  if p_approve then
    select id into them from persons where claimed_by = jr.user_id;
    if them is null then raise exception 'requester has no profile'; end if;
    if p_existing_profile is not null then
      if not exists (select 1 from family_members where family_id = jr.family_id and person_id = p_existing_profile) then
        raise exception 'that profile is not in this family';
      end if;
      perform public.merge_persons_internal(them, p_existing_profile);
    end if;
    insert into family_members (family_id, person_id, role, status, added_by)
      values (jr.family_id, them, 'member', 'active', auth.uid())
      on conflict (family_id, person_id) do update set status = 'active';
  end if;
  update join_requests set status = case when p_approve then 'approved' else 'declined' end, decided_by = auth.uid()
    where id = p_request;
end $$;

-- Admin: two profiles in my family are the same person.
create or replace function public.merge_duplicate(p_family uuid, p_keep uuid, p_drop uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_family_admin(p_family) then raise exception 'not allowed'; end if;
  if (select count(*) from family_members where family_id = p_family and person_id in (p_keep, p_drop)) <> 2 then
    raise exception 'both profiles must be in this family';
  end if;
  perform public.merge_persons_internal(p_keep, p_drop);
end $$;

-- Search by facts. Runs with the caller's rights, so RLS still applies.
create or replace function public.search_people(
  p_family uuid, p_q text default null, p_country text default null, p_city text default null,
  p_blood text default null, p_branch uuid default null, p_living_only boolean default false,
  p_limit integer default 50, p_offset integer default 0
) returns table (
  person_id uuid, given_name text, house_name text, name_ml text, photo_path text, gender text,
  current_city text, current_country text, occupation text, blood_group text,
  branch_id uuid, is_deceased boolean, score real
)
language sql stable security invoker set search_path = public, extensions as $$
  select p.id, p.given_name, p.house_name, p.name_ml, p.photo_path, p.gender,
         p.current_city, p.current_country, p.occupation, p.blood_group, fm.branch_id, p.is_deceased,
         case when nullif(trim(p_q),'') is null then 0::real
              else greatest(word_similarity(lower(trim(p_q)), p.search_text),
                            case when p.search_text like '%' || lower(trim(p_q)) || '%' then 0.9 else 0 end)::real end
  from family_members fm
  join persons p on p.id = fm.person_id
  where fm.family_id = p_family and fm.status = 'active' and not p.is_placeholder
    and (nullif(trim(p_q),'') is null
         or p.search_text like '%' || lower(trim(p_q)) || '%'
         or lower(trim(p_q)) <% p.search_text)
    and (p_country is null or p.current_country = upper(p_country))
    and (p_city is null or lower(p.current_city) = lower(p_city))
    and (p_blood is null or p.blood_group = p_blood)
    and (p_branch is null or fm.branch_id = p_branch)
    and (not p_living_only or not p.is_deceased)
  order by 13 desc, p.given_name
  limit least(p_limit, 200) offset p_offset
$$;

-- "Who is where": counts for the filter chips and the places view.
create or replace function public.family_facets(p_family uuid)
returns table (facet text, value text, people bigint)
language sql stable security invoker set search_path = public as $$
  with m as (
    select p.* from family_members fm join persons p on p.id = fm.person_id
    where fm.family_id = p_family and fm.status = 'active' and not p.is_placeholder and not p.is_deceased
  )
  select 'country', current_country, count(*) from m where current_country is not null group by 2
  union all select 'city', current_city, count(*) from m where current_city is not null group by 2
  union all select 'blood_group', blood_group, count(*) from m where blood_group is not null group by 2
  union all select 'occupation', occupation, count(*) from m where occupation is not null group by 2
  order by 1, 3 desc
$$;

-- "How are we related?": shortest chain of parent / child / spouse steps between two people.
-- Returns [{step, person}, …] or null. The app turns the chain into a kinship term (see packages/core/kinship).
create or replace function public.relation_path(p_from uuid, p_to uuid, p_max_depth integer default 10)
returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare
  prev jsonb := jsonb_build_object(p_from::text, null);
  frontier uuid[] := array[p_from];
  next_frontier uuid[];
  e record; depth integer := 0; cur uuid; result jsonb := '[]'::jsonb;
begin
  if p_from = p_to then return '[]'::jsonb; end if;
  while depth < p_max_depth and coalesce(array_length(frontier, 1), 0) > 0 loop
    next_frontier := '{}';
    for e in
      select distinct on (dst) src, dst, step from (
        select parent_id as src, child_id as dst, 'child' as step from parent_child where parent_id = any(frontier)
        union all select child_id, parent_id, 'parent' from parent_child where child_id = any(frontier)
        union all select person_a, person_b, 'spouse' from partnerships where person_a = any(frontier)
        union all select person_b, person_a, 'spouse' from partnerships where person_b = any(frontier)
      ) edges
      where not (prev ? dst::text)
      order by dst, (step = 'spouse')
    loop
      prev := prev || jsonb_build_object(e.dst::text, jsonb_build_object('p', e.src, 's', e.step));
      next_frontier := next_frontier || e.dst;
    end loop;
    exit when prev ? p_to::text;
    frontier := next_frontier;
    depth := depth + 1;
  end loop;
  if not (prev ? p_to::text) then return null; end if;
  cur := p_to;
  while cur <> p_from loop
    result := jsonb_build_array(jsonb_build_object('step', prev -> cur::text ->> 's', 'person', cur)) || result;
    cur := (prev -> cur::text ->> 'p')::uuid;
  end loop;
  return result;
end $$;

-- Erasure. Removes contact details and personal fields. If other people hang off this
-- profile in the tree, an anonymous "Private member" node is left so their links survive;
-- otherwise the profile is deleted outright. The server then deletes the auth user.
create or replace function public.erase_my_data() returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); me uuid := public.my_person_id(); linked boolean; fam record;
begin
  if uid is null then raise exception 'sign in first'; end if;
  if me is null then delete from profiles where user_id = uid; return 'no_profile'; end if;
  for fam in select family_id from family_members where person_id = me and role = 'owner' loop
    if exists (select 1 from family_members fm join persons p on p.id = fm.person_id
               where fm.family_id = fam.family_id and fm.person_id <> me and p.claimed_by is not null)
       and not exists (select 1 from family_members where family_id = fam.family_id and role = 'owner' and person_id <> me) then
      raise exception 'hand your family over to another owner before deleting your account' using hint = 'owner';
    end if;
  end loop;
  delete from person_contacts where person_id = me;
  delete from event_rsvps where person_id = me;
  delete from profiles where user_id = uid;
  delete from join_requests where user_id = uid;
  -- families I own where nobody else has an account go with me
  delete from families f
    where exists (select 1 from family_members fm where fm.family_id = f.id and fm.person_id = me and fm.role = 'owner')
      and not exists (select 1 from family_members fm join persons p on p.id = fm.person_id
                      where fm.family_id = f.id and fm.person_id <> me and p.claimed_by is not null);
  -- …and so do unclaimed profiles I created that are now in no family
  delete from persons p where p.created_by = uid and p.claimed_by is null
    and not exists (select 1 from family_members fm where fm.person_id = p.id);
  linked := exists (select 1 from parent_child where me in (parent_id, child_id))
         or exists (select 1 from partnerships where me in (person_a, person_b));
  if linked then
    update persons set given_name = 'Private member', house_name = null, name_ml = null, nickname = null,
      gender = 'unknown', birth_date = null, birth_precision = 'unknown', blood_group = null, occupation = null,
      employer = null, education = null, current_city = null, current_region = null, current_country = null,
      native_place = null, bio = null, photo_path = null, is_placeholder = true, consent_status = 'not_required',
      consent_note = null, claimed_by = null, created_by = null
    where id = me;
    update family_members set role = 'member' where person_id = me;
  else
    delete from persons where id = me;
  end if;
  return case when linked then 'anonymised' else 'deleted' end;
end $$;

-- ───────────────────────────── grants ─────────────────────────────

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from public, anon;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on
  public.persons, public.person_contacts, public.profiles, public.branches, public.family_members,
  public.parent_child, public.partnerships, public.events, public.event_rsvps to authenticated;
grant select, update, delete on public.families to authenticated;
grant select, insert, delete on public.invites to authenticated;
grant select, delete on public.join_requests to authenticated;
grant select, insert, update on public.consents to authenticated;
grant select, insert on public.data_requests to authenticated;
grant select on public.family_billing, public.payments, public.audit_log, public.tombstones to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

grant execute on function
  public.my_person_id(), public.family_role(uuid), public.is_family_member(uuid), public.family_writable(uuid),
  public.can_edit_family(uuid), public.is_family_admin(uuid), public.shares_family_with(uuid),
  public.is_admin_over(uuid), public.can_see_person(uuid), public.can_edit_person(uuid), public.is_minor(uuid),
  public.register_self(text, text, text, date, text, text),
  public.create_family(text, text, text),
  public.add_relative(uuid, uuid, text, text, text, text, date, text, boolean, text, uuid),
  public.accept_invite(text), public.family_by_code(text), public.request_join(text, text),
  public.decide_join_request(uuid, boolean, uuid), public.merge_duplicate(uuid, uuid, uuid),
  public.search_people(uuid, text, text, text, text, uuid, boolean, integer, integer),
  public.family_facets(uuid), public.relation_path(uuid, uuid, integer), public.erase_my_data()
to authenticated;
grant execute on all functions in schema public to service_role;
