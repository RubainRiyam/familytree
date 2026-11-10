-- Local stand-ins for what Supabase provides. NEVER run this against a Supabase project.
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), phone text unique);
create or replace function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
grant usage on schema auth to authenticated, service_role;
grant execute on function auth.uid() to authenticated, anon, service_role;
create schema if not exists extensions;
grant usage on schema extensions to authenticated, service_role;
